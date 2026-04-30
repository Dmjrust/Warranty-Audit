
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Truck, 
  Wrench, 
  ClipboardList, 
  Camera, 
  DollarSign, 
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  Upload,
  X,
  BrainCircuit,
  Copy,
  TrendingDown,
  AlertOctagon,
  Plus,
  Trash2,
  FileCheck,
  Image as ImageIcon,
  Calendar,
  Zap,
  Hammer,
  HelpCircle,
  FileText,
  ScanText,
  Download,
  Info,
  ShieldAlert,
  Printer,
  History as HistoryIcon,
  MessageSquareQuote
} from 'lucide-react';
import { preAnalyzeFailureImage, AIFailureGuidance } from '../services/gemini';
import { useProcessStore } from '../store';
import { ProcessStatus } from '../types';

const STEPS = [
  { id: 'vehicle', label: 'Veículo', icon: Truck },
  { id: 'checklist', label: 'Checklist', icon: ClipboardList },
  { id: 'analysis', label: 'Análise', icon: Wrench },
  { id: 'audit', label: 'Auditoria', icon: ShieldCheck },
];

type ChecklistValue = 'sim' | 'nao' | 'nao_sei' | null;

// Tipos de Perguntas para o Score Determinístico
enum QuestionType {
  PRO_GARANTIA = 'PRO_GARANTIA',
  EXCLUSAO = 'EXCLUSAO',
  CONTEXTUAL = 'CONTEXTUAL'
}

const ProcessWizard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ecuInputRef = useRef<HTMLInputElement>(null);
  const { processes } = useProcessStore();
  
  const [loading, setLoading] = useState(!!id);
  const [processData, setProcessData] = useState<any>(null);
  const [policySchema, setPolicySchema] = useState<any>(null);

  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (id) {
      fetch(`/api/processes/${id}`)
        .then(res => res.json())
        .then(data => {
          setProcessData(data);
          setPolicySchema(data.policyVersion.schemaJson);
          
          // Initializing dynamic form values if empty
          if (data.policyVersion.schemaJson) {
            const schema = data.policyVersion.schemaJson;
            const initialDynamicData: any = {};
            
            // Loop steps to find fields
            Object.keys(schema.steps || {}).forEach(stepKey => {
              const step = schema.steps[stepKey];
              if (step.fields) {
                step.fields.forEach((f: any) => {
                  initialDynamicData[f.name] = '';
                });
              }
              if (step.questions) {
                step.questions.forEach((q: any) => {
                  initialDynamicData[q.id] = null;
                });
              }
            });

            // Parse existing data if present
            const vehicleData = data.vehicleDataJson ? JSON.parse(data.vehicleDataJson) : {};
            const checklistData = data.checklistDataJson ? JSON.parse(data.checklistDataJson) : {};
            const analysisData = data.analysisDataJson ? JSON.parse(data.analysisDataJson) : {};
            
            setFormData(prev => ({
              ...prev,
              ...initialDynamicData,
              ...vehicleData,
              ...checklistData,
              ...analysisData,
              // Special mappings for nested structures
              verbalizacaoCliente: analysisData.verbalizacao || prev.verbalizacaoCliente,
              inspecaoInicial: analysisData.inspecao || prev.inspecaoInicial,
              montadora: schema.manufacturer || prev.montadora,
            }));

            if (analysisData.aiGuidance) {
              setAiGuidance(analysisData.aiGuidance);
            }
          }
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [id]);

  const [formData, setFormData] = useState({
    vin: 'YV2R5826XKA759182',
    hodometro: '145000',
    montadora: 'Volvo',
    modelo: 'FH 540 Globetrotter',
    ano: '2023',
    naturezaFalha: 'mecanica' as 'mecanica' | 'eletroeletronica' | '',
    sistemaFalha: 'transmissao',
    tipoFalha: 'Platô/Disco de Embreagem',
    componentePrincipal: 'Embreagem',
    verbalizacaoCliente: 'Caminhão apresenta dificuldade em engatar marchas e trepidação ao arrancar carregado.',
    sintomas: 'Trepidação excessiva em baixas rotações e cheiro de queimado.',
    inspecaoInicial: 'Desmontagem da caixa confirmou azulamento excessivo no platô.',
    causaRaiz: 'Falha no material de fricção do disco resultando em superaquecimento precoce.',
    testes: 'Teste de estanqueidade e análise metalográfica visual.',
    dtcCodes: '',
    failureImages: [] as string[],
    ecuData: null as string | null,
    checklist: {
      manutencao_dia: 'sim' as ChecklistValue,
      uso_indevido: 'nao' as ChecklistValue,
      dano_externo: 'nao' as ChecklistValue,
      historico_trocas: 'nao' as ChecklistValue,
    },
    pecas: [
      { id: '1', desc: 'Kit Embreagem Volvo Original', valor: 4250.00 },
      { id: '2', desc: 'Retentor de Eixo', valor: 180.00 }
    ] as { id: string, desc: string, valor: number }[],
    mo: [
      { id: '1', desc: 'Substituição Kit Embreagem', horas: 4.5, valor: 900.00 }
    ] as { id: string, desc: string, horas: number, valor: number }[]
  });

  const [aiGuidance, setAiGuidance] = useState<AIFailureGuidance | null>(null);
  const [isPreAnalyzing, setIsPreAnalyzing] = useState(false);
  const [historicalStats, setHistoricalStats] = useState({ 
    probability: 0.75, 
    count: 0, 
    fallbackUsed: false, 
    insufficient: true 
  });

  useEffect(() => {
    if (formData.montadora && formData.naturezaFalha && formData.componentePrincipal) {
      const qs = new URLSearchParams({
        manufacturer: formData.montadora,
        category: formData.naturezaFalha,
        component: formData.componentePrincipal
      }).toString();
      
      fetch(`/api/stats/historical-score?${qs}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) setHistoricalStats(data);
        })
        .catch(err => console.error("History fetch error:", err));
    }
  }, [formData.montadora, formData.naturezaFalha, formData.componentePrincipal]);

  const traceabilityNumber = useMemo(() => `WAP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}-X`, []);

  const isWithinWarranty = useMemo(() => {
    if (!formData.ano) return 'nao_sei';
    const currentYear = new Date().getFullYear();
    const vehicleYear = parseInt(formData.ano);
    return (currentYear - vehicleYear) <= 2 ? 'sim' : 'nao';
  }, [formData.ano]);

  // SD: SCORE DETERMINÍSTICO (Base 100)
  const checklistAudit = useMemo(() => {
    let auditQuestions: any[] = [];
    
    if (policySchema?.steps?.checklist?.questions) {
      auditQuestions = policySchema.steps.checklist.questions.map((q: any) => ({
        id: q.id,
        type: q.logicType || QuestionType.PRO_GARANTIA,
        answer: (formData as any)[q.id]
      }));
      
      // Auto-add warranty period check if not present in schema but relevant
      if (!auditQuestions.find(q => q.id === 'prazo')) {
        auditQuestions.unshift({ id: 'prazo', type: QuestionType.PRO_GARANTIA, answer: isWithinWarranty });
      }
    } else {
      auditQuestions = [
        { id: 'prazo', type: QuestionType.PRO_GARANTIA, answer: isWithinWarranty },
        { id: 'manutencao', type: QuestionType.PRO_GARANTIA, answer: formData.checklist.manutencao_dia },
        { id: 'uso_indevido', type: QuestionType.EXCLUSAO, answer: formData.checklist.uso_indevido },
        { id: 'dano_externo', type: QuestionType.EXCLUSAO, answer: formData.checklist.dano_externo },
        { id: 'historico', type: QuestionType.CONTEXTUAL, answer: formData.checklist.historico_trocas }
      ];
    }

    const totalMax = 100;
    const pesoBase = totalMax / auditQuestions.length;
    let score = 0;
    let hardStop = false;

    auditQuestions.forEach(q => {
      let qScore = 0;
      let isUnfavorable = false;

      if (q.type === QuestionType.PRO_GARANTIA) {
        if (q.answer === 'sim') qScore = pesoBase;
        else if (q.answer === 'nao_sei') qScore = pesoBase * 0.5;
        else { qScore = 0; isUnfavorable = true; }
      } 
      else if (q.type === QuestionType.EXCLUSAO) {
        if (q.answer === 'nao') qScore = pesoBase;
        else if (q.answer === 'nao_sei') qScore = pesoBase * 0.5;
        else { qScore = 0; isUnfavorable = true; }
      }
      else if (q.type === QuestionType.CONTEXTUAL) {
        if (q.answer === 'nao') qScore = pesoBase;
        else if (q.answer === 'sim' || q.answer === 'nao_sei') qScore = pesoBase * 0.5;
      }

      score += qScore;
      if (isUnfavorable) hardStop = true;
    });

    return { score: Math.round(score), max: totalMax, hardStop };
  }, [formData, isWithinWarranty, policySchema]);

  // ST: SCORE TÉCNICO IA (Base 100)
  const technicalScore = useMemo(() => {
    const raw = aiGuidance ? aiGuidance.scoreAprovação : 0;
    return {
      raw,
      normalized: raw,
      max: 100,
      model: "gemini-3-flash-preview",
      timestamp: aiGuidance ? new Date().toISOString() : null
    };
  }, [aiGuidance]);

  // SH: SCORE HISTÓRICO LOCAL (Base 100)
  const historicalScore = useMemo(() => {
    const normalized = Number((historicalStats.probability * 100).toFixed(1)); 

    return {
      normalized,
      max: 100,
      insufficient: historicalStats.insufficient,
      count: historicalStats.count,
      fallbackUsed: historicalStats.fallbackUsed
    };
  }, [historicalStats]);

  // SF: SCORE FINAL DEFINITIVO (Ponderado)
  const finalScoreResult = useMemo(() => {
    const W_SD = 0.35;
    const W_ST = 0.45;
    const W_SH = 0.20;

    const score = Number((
      (checklistAudit.score * W_SD) + 
      (technicalScore.normalized * W_ST) + 
      (historicalScore.normalized * W_SH)
    ).toFixed(1));

    // Nível de Confiança
    // Fatores: Qtd imagens, ECU, DTCs, Tamanho da descrição
    let confidencePoints = 0;
    confidencePoints += Math.min(formData.failureImages.length * 10, 40); // Até 40% (4 imagens)
    if (formData.ecuData) confidencePoints += 20; // 20%
    if (formData.dtcCodes && formData.dtcCodes.trim().length > 0) confidencePoints += 20; // 20%
    if (formData.causaRaiz.length > 50) confidencePoints += 10; // 10%
    if (formData.testes.length > 50) confidencePoints += 10; // 10%

    // Risco de Glosa
    let risk = 'BAIXO';
    if (checklistAudit.hardStop) risk = 'CRÍTICO';
    else if (score < 40) risk = 'ALTO';
    else if (score < 70) risk = 'MODERADO';

    // Completude Documental
    const requiredFields = [formData.vin, formData.hodometro, formData.modelo, formData.causaRaiz, formData.sintomas];
    const filledFields = requiredFields.filter(f => f && f.toString().trim().length > 0).length;
    const completeness = (filledFields / requiredFields.length) * 100;

    // Consistência Técnica (Sintomas vs Causa Raiz)
    // Para simplificar, usamos a pontuação da IA como proxy, mas podemos ajustar
    const technicalConsistency = technicalScore.normalized;

    return {
      score,
      confidence: confidencePoints,
      risk,
      completeness,
      consistency: technicalConsistency
    };
  }, [checklistAudit, technicalScore, historicalScore, formData]);

  const finalScore = finalScoreResult.score;

  // CLASSIFICAÇÃO PROPORCIONAL
  const scoreClassification = useMemo(() => {
    const sf = finalScore;
    if (sf >= 80) return { 
      label: 'Parecer: Favorável', 
      bg: 'bg-emerald-50', 
      text: 'text-emerald-600', 
      border: 'border-emerald-100', 
      icon: ShieldCheck, 
      probability: 'Alta Probabilidade',
      riskColor: 'text-emerald-600'
    };
    if (sf >= 60) return { 
      label: 'Parecer: Sob Análise', 
      bg: 'bg-amber-50', 
      text: 'text-amber-600', 
      border: 'border-amber-100', 
      icon: AlertTriangle, 
      probability: 'Risco Moderado',
      riskColor: 'text-amber-600'
    };
    if (sf >= 40) return { 
      label: 'Parecer: Negativa', 
      bg: 'bg-rose-50', 
      text: 'text-rose-600', 
      border: 'border-rose-100', 
      icon: ShieldAlert, 
      probability: 'Alto Risco',
      riskColor: 'text-rose-600'
    };
    return { 
      label: 'Parecer: Negativa', 
      bg: 'bg-rose-100', 
      text: 'text-rose-700', 
      border: 'border-rose-200', 
      icon: ShieldAlert, 
      probability: 'Altíssima Prob. de Débito',
      riskColor: 'text-rose-800'
    };
  }, [finalScore]);

  const wizardSteps = useMemo(() => {
    if (!policySchema || !policySchema.steps) return STEPS;
    
    // Map policy schema steps to STEPS structure
    const dynamicSteps = [];
    if (policySchema.steps.vehicle) dynamicSteps.push({ id: 'vehicle', label: policySchema.steps.vehicle.title || 'Veículo', icon: Truck });
    if (policySchema.steps.checklist) dynamicSteps.push({ id: 'checklist', label: policySchema.steps.checklist.title || 'Checklist', icon: ClipboardList });
    
    // Always include Analysis and Audit as they are system pillars
    dynamicSteps.push({ id: 'analysis', label: 'Análise', icon: Wrench });
    dynamicSteps.push({ id: 'audit', label: 'Auditoria', icon: ShieldCheck });
    
    return dynamicSteps;
  }, [policySchema]);

  const saveProcess = async (overrides = {}) => {
    if (!id) return;
    
    const payload = {
      currentStep: wizardSteps[currentStep]?.id,
      vehicleDataJson: {
        vin: (formData as any).vin,
        hodometro: (formData as any).hodometro,
        modelo: (formData as any).modelo,
        ano: (formData as any).ano,
        naturezaFalha: formData.naturezaFalha,
        ...(policySchema?.steps?.vehicle?.fields?.reduce((acc: any, f: any) => {
          acc[f.name] = (formData as any)[f.name];
          return acc;
        }, {}) || {})
      },
      checklistDataJson: {
        ...formData.checklist,
        ...(policySchema?.steps?.checklist?.questions?.reduce((acc: any, q: any) => {
          acc[q.id] = (formData as any)[q.id];
          return acc;
        }, {}) || {})
      },
      analysisDataJson: {
        verbalizacao: formData.verbalizacaoCliente,
        sintomas: formData.sintomas,
        inspecao: formData.inspecaoInicial,
        causaRaiz: formData.causaRaiz,
        testes: formData.testes,
        dtcCodes: formData.dtcCodes,
        aiGuidance: aiGuidance
      },
      scoringResultJson: finalScoreResult,
      ...overrides
    };

    try {
      await fetch(`/api/processes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error("Failed to sync process:", err);
    }
  };

  const handleNext = async () => {
    if (currentStep < wizardSteps.length - 1) {
      await saveProcess();
      setCurrentStep(currentStep + 1);
    } else {
      await handleSubmit();
    }
  };

  const handleSubmit = async () => {
    try {
      await saveProcess({ status: ProcessStatus.PRONTO_SUBMISSAO });
      alert('Auditoria finalizada com sucesso!');
      navigate('/processes');
    } catch (err) {
      console.error(err);
      alert('Erro ao finalizar auditoria.');
    }
  };

  const handleBack = async () => {
    if (currentStep > 0) {
      await saveProcess();
      setCurrentStep(currentStep - 1);
    }
  };

  const handleMultipleImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({ 
            ...prev, 
            failureImages: [...prev.failureImages, reader.result as string] 
          }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleEcuUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, ecuData: reader.result as string });
      };
      reader.readAsDataURL(file as File);
    }
  };

  const handlePreAnalyze = async () => {
    setIsPreAnalyzing(true);
    try {
      const evidence = {
        images: formData.failureImages,
        ecuData: formData.ecuData,
        dtcCodes: formData.dtcCodes,
        verbalization: formData.verbalizacaoCliente,
        sintomas: formData.sintomas
      };
      const guidance = await preAnalyzeFailureImage(evidence, policySchema);
      setAiGuidance(guidance);
      await saveProcess({ analysisDataJson: { 
        verbalizacao: formData.verbalizacaoCliente,
        sintomas: formData.sintomas,
        inspecao: formData.inspecaoInicial,
        causaRaiz: formData.causaRaiz,
        testes: formData.testes,
        dtcCodes: formData.dtcCodes,
        aiGuidance: guidance 
      }});
    } catch (error) {
      console.error(error);
    } finally {
      setIsPreAnalyzing(false);
    }
  };

  const updateChecklist = (key: keyof typeof formData.checklist, value: ChecklistValue) => {
    setFormData({
      ...formData,
      checklist: {
        ...formData.checklist,
        [key]: value
      }
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getScoreBgColor = (score: number, max: number) => {
    const percent = (score / max) * 100;
    if (percent >= 80) return 'bg-emerald-500';
    if (percent >= 60) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const renderScoreBreakdown = (label: string, value: number, max: number) => {
    const colorClass = getScoreBgColor(value, max);
    return (
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] font-bold tracking-wider">
          <span className="text-slate-500 uppercase">{label}</span>
          <span className="text-slate-900 font-extrabold">{value} / {max}</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full ${colorClass} rounded-full transition-all duration-1000`} 
            style={{ width: `${(value / max) * 100}%` }}
          />
        </div>
      </div>
    );
  };

  const RadioGroup = ({ label, value, onChange }: { label: string, value: ChecklistValue, onChange: (v: ChecklistValue) => void }) => (
    <div className="p-6 rounded-[24px] border border-slate-100 bg-white hover:border-slate-200 transition-all space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-700 tracking-tight">{label}</p>
        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Obrigatório</span>
      </div>
      <div className="flex gap-2">
        {[
          { id: 'sim', label: 'Sim', color: 'peer-checked:bg-emerald-500 peer-checked:text-white' },
          { id: 'nao', label: 'Não', color: 'peer-checked:bg-rose-500 peer-checked:text-white' },
          { id: 'nao_sei', label: 'Não sei', color: 'peer-checked:bg-slate-500 peer-checked:text-white' }
        ].map((opt) => (
          <label key={opt.id} className="flex-1 cursor-pointer">
            <input 
              type="radio" 
              className="hidden peer" 
              checked={value === opt.id}
              onChange={() => onChange(opt.id as ChecklistValue)}
            />
            <div className={`py-2.5 rounded-xl border border-slate-100 bg-slate-50/50 text-center text-[11px] font-black uppercase tracking-wider text-slate-400 transition-all hover:bg-slate-100 ${opt.color} peer-checked:border-transparent peer-checked:shadow-md`}>
              {opt.label}
            </div>
          </label>
        ))}
      </div>
    </div>
  );

  const renderStepContent = () => {
    if (loading) return <div className="p-20 text-center font-black animate-pulse text-slate-400 uppercase tracking-widest">Carregando Policy...</div>;

    switch (currentStep) {
      case 0: // VEICULO
        const vehicleStep = policySchema?.steps?.vehicle;
        return (
          <div className="space-y-10 max-w-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{vehicleStep?.title || 'Identificação do Veículo'}</h2>
                <p className="text-slate-400 text-sm mt-1">Insira os dados técnicos do ativo para auditoria.</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1 text-right">Montadora</span>
                  <span className="text-xs font-bold text-slate-900">Marca configurada: <span className="text-brand-500">{formData.montadora}</span></span>
                </div>
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`px-3 py-1.5 rounded-xl flex items-center gap-2 border shadow-sm ${
                    isWithinWarranty === 'sim' 
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                      : isWithinWarranty === 'nao' 
                        ? 'bg-rose-50 border-rose-100 text-rose-600'
                        : 'bg-slate-50 border-slate-100 text-slate-500'
                  }`}
                >
                  <ShieldCheck size={14} className={isWithinWarranty === 'sim' ? 'animate-pulse' : ''} />
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    {isWithinWarranty === 'sim' ? 'Garantia Ativa' : isWithinWarranty === 'nao' ? 'Garantia Expirada' : 'Status Indefinido'}
                  </span>
                </motion.div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {vehicleStep?.fields ? (
                vehicleStep.fields.map((f: any) => (
                  <div key={f.name} className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">{f.label}</label>
                    <input 
                      type={f.type === 'number' ? 'number' : 'text'} 
                      placeholder={`Ex: ${f.label}...`}
                      value={(formData as any)[f.name] || ''} 
                      onChange={(e) => setFormData({...formData, [f.name]: e.target.value})} 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-[20px] outline-none focus:ring-2 focus:ring-brand-500/20 text-sm font-bold text-slate-700 transition-all" 
                    />
                  </div>
                ))
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">VIN (Chassi)</label>
                    <input type="text" placeholder="Ex: YV2R..." value={formData.vin} onChange={(e) => setFormData({...formData, vin: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-[20px] outline-none focus:ring-2 focus:ring-brand-500/20 text-sm font-bold text-slate-700 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Hodômetro (km)</label>
                    <input type="number" placeholder="0" value={formData.hodometro} onChange={(e) => setFormData({...formData, hodometro: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-[20px] outline-none focus:ring-2 focus:ring-brand-500/20 text-sm font-bold text-slate-700 transition-all" />
                  </div>
                </>
              )}
              
              {!vehicleStep?.fields && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Modelo</label>
                    <input type="text" placeholder="Ex: FH 540 Globetrotter" value={formData.modelo} onChange={(e) => setFormData({...formData, modelo: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-[20px] outline-none focus:ring-2 focus:ring-brand-500/20 text-sm font-bold text-slate-700 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Calendar size={12} className="text-slate-400" /> Ano do Veículo</label>
                    <input type="number" placeholder="Ex: 2024" min="2000" max={new Date().getFullYear()} value={formData.ano} onChange={(e) => setFormData({...formData, ano: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-[20px] outline-none focus:ring-2 focus:ring-brand-500/20 text-sm font-bold text-slate-700 transition-all" />
                  </div>
                </>
              )}

              <div className="md:col-span-2 space-y-4 pt-4">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Natureza da Falha</label>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setFormData({...formData, naturezaFalha: 'mecanica'})} className={`flex items-center justify-center gap-3 p-6 rounded-[24px] border transition-all ${formData.naturezaFalha === 'mecanica' ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-md ring-2 ring-brand-500/10' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}><Hammer size={20} /><span className="text-sm font-extrabold uppercase tracking-tight">Mecânica</span></button>
                  <button onClick={() => setFormData({...formData, naturezaFalha: 'eletroeletronica'})} className={`flex items-center justify-center gap-3 p-6 rounded-[24px] border transition-all ${formData.naturezaFalha === 'eletroeletronica' ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-md ring-2 ring-brand-500/10' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}><Zap size={20} /><span className="text-sm font-extrabold uppercase tracking-tight">Eletro-eletrônica</span></button>
                </div>
              </div>
            </div>
          </div>
        );

      case 1: // CHECKLIST
        const checklistStep = policySchema?.steps?.checklist;
        return (
          <div className="space-y-10 max-w-3xl">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{checklistStep?.title || 'Checklist de Pré-Diagnóstico'}</h2>
                <p className="text-slate-400 text-sm mt-1">Validação de conformidade operacional.</p>
              </div>
              <div className="aura-glass px-6 py-4 rounded-[24px] border-slate-100 flex items-center gap-6 shadow-sm">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score Checklist (SD)</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-slate-900">{checklistAudit.score}<span className="text-slate-300 text-sm">/{checklistAudit.max}</span></span>
                    <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full bg-brand-500 rounded-full`} style={{ width: `${(checklistAudit.score / checklistAudit.max) * 100}%` }} />
                    </div>
                  </div>
                </div>
                {checklistAudit.hardStop && (
                  <div className="px-3 py-1 bg-rose-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-rose-500/20">
                    <ShieldAlert size={12} /> Alerta Crítico
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {checklistStep?.questions ? (
                checklistStep.questions.map((q: any) => (
                  <RadioGroup 
                    key={q.id} 
                    label={q.label} 
                    value={(formData as any)[q.id] || null} 
                    onChange={(v) => setFormData(prev => ({ ...prev, [q.id]: v }))} 
                  />
                ))
              ) : (
                <>
                  <RadioGroup label="Manutenção preventiva em dia?" value={formData.checklist.manutencao_dia} onChange={(v) => updateChecklist('manutencao_dia', v)} />
                  <RadioGroup label="Evidência de uso indevido?" value={formData.checklist.uso_indevido} onChange={(v) => updateChecklist('uso_indevido', v)} />
                  <RadioGroup label="Indícios de dano externo?" value={formData.checklist.dano_externo} onChange={(v) => updateChecklist('dano_externo', v)} />
                  <RadioGroup label="Histórico recente de trocas?" value={formData.checklist.historico_trocas} onChange={(v) => updateChecklist('historico_trocas', v)} />
                </>
              )}
            </div>
          </div>
        );

      case 2: // ANÁLISE
        return (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Análise Técnica e Financeira</h2>
                <div className="flex items-center gap-2 text-sm text-slate-400 mt-1 font-medium"><span>OS #2024-1547</span> • <span>{formData.montadora} {formData.modelo}</span></div>
              </div>
              <div className="flex items-center gap-4">
                {checklistAudit.hardStop && (
                   <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="px-4 py-2.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <ShieldAlert size={16} /> Elegibilidade Crítica: Revisar antes de submeter
                  </motion.div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Card 1: Descrição Técnica */}
              <div className="lg:col-span-4 aura-glass p-7 rounded-[32px] space-y-5 shadow-sm border-slate-50 flex flex-col">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Wrench size={14} /> 1. Descrição Técnica</h3>
                <div className="flex-1 grid grid-cols-1 gap-4 overflow-y-auto pr-2 custom-scrollbar max-h-[520px]">
                  {formData.naturezaFalha === 'mecanica' && (
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Componente Principal</label><input type="text" value={formData.componentePrincipal} onChange={(e) => setFormData({...formData, componentePrincipal: e.target.value})} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 text-[11px] font-bold" /></div>
                  )}
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Verbalização Cliente</label><textarea value={formData.verbalizacaoCliente} onChange={(e) => setFormData({...formData, verbalizacaoCliente: e.target.value})} rows={2} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none text-[11px]" /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Sintomas Oficina</label><textarea value={formData.sintomas} onChange={(e) => setFormData({...formData, sintomas: e.target.value})} rows={2} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none text-[11px]" /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Inspeção Inicial</label><textarea value={formData.inspecaoInicial} onChange={(e) => setFormData({...formData, inspecaoInicial: e.target.value})} rows={2} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none text-[11px]" /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Causa Raiz</label><textarea value={formData.causaRaiz} onChange={(e) => setFormData({...formData, causaRaiz: e.target.value})} rows={2} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none text-[11px]" /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Testes</label><textarea value={formData.testes} onChange={(e) => setFormData({...formData, testes: e.target.value})} rows={2} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none text-[11px]" /></div>
                </div>
              </div>

              {/* Card 2: Evidência Principal */}
              <div className="lg:col-span-4 aura-glass p-7 rounded-[32px] flex flex-col justify-between shadow-sm border-slate-50">
                <div className="space-y-5">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Camera size={14} /> 2. Evidência Principal</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      {formData.failureImages.map((img, i) => (
                        <div key={i} className="aspect-square rounded-xl overflow-hidden border border-slate-100 relative group">
                          <img src={img} className="w-full h-full object-cover" />
                          <button onClick={() => setFormData(p => ({...p, failureImages: p.failureImages.filter((_, idx) => idx !== i)}))} className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><X size={10}/></button>
                        </div>
                      ))}
                      <div onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-500 transition-all">
                        <Plus size={20} className="text-slate-300" />
                        <span className="text-[8px] font-black text-slate-400 uppercase">Adicionar Foto</span>
                      </div>
                    </div>
                    <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleMultipleImagesUpload} />
                    
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Dados da Central / Scanner</label>
                        {!formData.ecuData ? (
                          <div onClick={() => ecuInputRef.current?.click()} className="p-4 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50 flex items-center gap-3 cursor-pointer hover:border-slate-300 transition-all group">
                            <FileText size={18} className="text-slate-300 group-hover:text-brand-500 transition-colors" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Subir log / Relatório ECU</span>
                          </div>
                        ) : (
                          <div className="p-3 bg-brand-50 border border-brand-100 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileCheck size={14} className="text-brand-500" />
                              <span className="text-[10px] font-bold text-brand-700">Scanner OK</span>
                            </div>
                            <button onClick={() => setFormData({ ...formData, ecuData: null })} className="p-1 hover:bg-brand-100 rounded-lg text-brand-500"><X size={12}/></button>
                          </div>
                        )}
                        <input ref={ecuInputRef} type="file" className="hidden" onChange={handleEcuUpload} />
                    </div>
                  </div>
                </div>

                {/* Botão Executar Auditoria IA */}
                <div className="pt-6">
                  <button 
                    onClick={handlePreAnalyze} 
                    disabled={isPreAnalyzing || formData.failureImages.length === 0} 
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-[20px] text-[11px] font-black uppercase tracking-[0.1em] hover:bg-brand-500 transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {isPreAnalyzing ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <BrainCircuit size={20} className="group-hover:animate-pulse" />
                    )}
                    {isPreAnalyzing ? 'Processando Auditoria...' : 'Executar Auditoria IA'}
                  </button>
                </div>
              </div>

              {/* Card 3: Score de Confiança */}
              <div className="lg:col-span-4 aura-glass p-7 rounded-[32px] flex flex-col justify-between shadow-sm border-slate-50 relative overflow-hidden">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={14} /> 3. Score de Confiança</h3>
                
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />

                <div className="flex-1 flex flex-col items-center justify-center py-4">
                  <div className="relative w-40 h-40 flex items-center justify-center mb-4">
                    <svg className="w-full h-full -rotate-90 overflow-visible" viewBox="0 0 160 160">
                      <circle cx="80" cy="80" r="72" stroke="#f1f5f9" strokeWidth="12" fill="transparent" />
                      {/* Gauge em escala 100 */}
                      <motion.circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={452} initial={{ strokeDashoffset: 452 }} animate={{ strokeDashoffset: 452 - (452 * finalScore / 100) }} className={getScoreColor(finalScore)} strokeLinecap="round" />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-5xl font-black text-slate-900 tracking-tighter leading-none">{finalScore}</span>
                      <p className="text-[10px] font-black text-slate-400 uppercase mt-1">Pontos / 100</p>
                    </div>
                  </div>
                  <div className={`px-5 py-3 rounded-[20px] border text-[11px] font-black uppercase tracking-widest ${scoreClassification.bg} ${scoreClassification.text} ${scoreClassification.border} flex flex-col items-center gap-0.5 shadow-sm`}>
                    <div className="flex items-center gap-2">
                      <scoreClassification.icon size={14} /> {scoreClassification.label}
                    </div>
                    <span className={`text-[9px] font-bold ${scoreClassification.riskColor} opacity-90 tracking-tight`}>{scoreClassification.probability}</span>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-50">
                  <div className="grid grid-cols-2 gap-4 pb-2 border-b border-slate-50/50">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Nível de Confiança</span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${finalScoreResult.confidence}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-slate-700">{finalScoreResult.confidence}%</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Risco de Glosa</span>
                      <span className={`text-[11px] font-black leading-none ${
                        finalScoreResult.risk === 'BAIXO' ? 'text-emerald-500' : 
                        finalScoreResult.risk === 'MODERADO' ? 'text-amber-500' : 'text-rose-600'
                      }`}>
                        {finalScoreResult.risk}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {renderScoreBreakdown('Score Determinístico (SD) • 35%', checklistAudit.score, 100)}
                    {renderScoreBreakdown('Score Técnico IA (ST) • 45%', technicalScore.normalized, 100)}
                    {renderScoreBreakdown('Score Histórico Local (SH) • 20%', historicalScore.normalized, 100)}
                  </div>
                  
                  {historicalScore.insufficient && (
                    <div className="mt-2 p-2 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2">
                      <Info size={12} className="text-slate-400 shrink-0" />
                      <span className="text-[8px] font-bold text-slate-400 uppercase leading-tight tracking-tighter">Histórico estatístico insuficiente — valor médio aplicado</span>
                    </div>
                  )}

                  <div className="pt-3 grid grid-cols-2 gap-3 border-t border-slate-50 mt-1">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-400 uppercase">Completude</span>
                      <span className="text-xs font-black text-slate-800">{finalScoreResult.completeness.toFixed(0)}%</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-400 uppercase">Consistência</span>
                      <span className="text-xs font-black text-slate-800">{finalScoreResult.consistency.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Parecer IA */}
            <AnimatePresence>
              {aiGuidance && (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                >
                  <div className="aura-glass p-8 rounded-[40px] border-l-[12px] border-brand-500 bg-emerald-50/10 space-y-6">
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <MessageSquareQuote className="text-brand-500" size={18} /> Parecer Técnico IA
                    </h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resumo da Análise</span>
                        <p className="text-sm text-slate-700 leading-relaxed font-medium bg-white/50 p-4 rounded-2xl border border-slate-100 italic">
                          "{aiGuidance.causaRaizProvavel}"
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                          <span className="text-[10px] font-black text-brand-500 uppercase block mb-2">Sintomas Identificados</span>
                          <p className="text-[11px] text-slate-600 font-bold leading-tight">{aiGuidance.sintomasSugeridos}</p>
                        </div>
                        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                          <span className="text-[10px] font-black text-amber-500 uppercase block mb-2">Testes Recomendados</span>
                          <p className="text-[11px] text-slate-600 font-bold leading-tight">{aiGuidance.testesRecomendados}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="aura-glass p-8 rounded-[40px] space-y-6">
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <AlertTriangle className="text-amber-500" size={18} /> Pontos de Atenção & Alertas
                    </h4>
                    <div className="space-y-3 overflow-y-auto max-h-[220px] pr-2 custom-scrollbar">
                      {aiGuidance.pontosDeAtencao.map((ponto, i) => (
                        <div key={i} className={`p-4 rounded-2xl border flex items-start gap-4 ${ponto.tipo === 'CRÍTICO' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'}`}>
                          <div className={`mt-0.5 p-1 rounded-lg ${ponto.tipo === 'CRÍTICO' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'}`}>
                            {ponto.tipo === 'CRÍTICO' ? <AlertOctagon size={14} /> : <AlertTriangle size={14} />}
                          </div>
                          <div className="flex-1">
                            <h5 className={`text-[11px] font-black uppercase tracking-tight ${ponto.tipo === 'CRÍTICO' ? 'text-rose-700' : 'text-amber-700'}`}>{ponto.titulo}</h5>
                            <p className="text-[10px] text-slate-600 mt-0.5 leading-normal">{ponto.descricao}</p>
                            <div className="mt-2 text-[9px] font-bold text-slate-400 uppercase bg-white/60 px-2 py-1 rounded-md inline-block border border-slate-100">Impacto: -{ponto.impacto} pts</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );

      case 3: // AUDITORIA FINAL
        const isFavorable = finalScore >= 80;
        return (
          <div className="space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="space-y-1">
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Parecer de Auditoria Final</h2>
                <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                  <span className="flex items-center gap-1"><ShieldCheck size={14}/> ID: {traceabilityNumber}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Calendar size={14}/> {new Date().toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                  <Printer size={16} /> Imprimir
                </button>
                <button className="flex items-center gap-2 px-8 py-3 bg-brand-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-brand-600 transition-all shadow-xl shadow-brand-500/20">
                  <Download size={16} /> Download PDF
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className={`lg:col-span-1 p-10 rounded-[48px] border-l-[12px] flex flex-col items-center justify-center text-center shadow-xl ${isFavorable ? 'bg-emerald-50/50 border-emerald-500' : 'bg-rose-50/50 border-rose-500'}`}>
                <div className="relative w-36 h-36 flex items-center justify-center mb-6">
                  <svg className="w-full h-full -rotate-90 overflow-visible" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="68" stroke="white" strokeWidth="12" fill="transparent" />
                    <motion.circle cx="80" cy="80" r="68" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={427} initial={{ strokeDashoffset: 427 }} animate={{ strokeDashoffset: 427 - (427 * finalScore / 100) }} className={isFavorable ? 'text-emerald-500' : 'text-rose-500'} strokeLinecap="round" transition={{ duration: 1 }} />
                  </svg>
                  <span className="absolute text-5xl font-black text-slate-900 tracking-tighter">{finalScore}</span>
                </div>
                <div className={`flex items-center gap-2 mb-2 font-black text-xs uppercase tracking-widest ${isFavorable ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {isFavorable ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />}
                  {isFavorable ? 'Pró-Garantia' : 'Negativa'}
                </div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{scoreClassification.probability}</div>
              </div>

              <div className="lg:col-span-3 aura-glass p-8 rounded-[48px] shadow-sm flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Info size={14} /> Resumo Analítico (Score: {finalScore}/100)</h3>
                    <div className="flex items-center gap-2">
                       {checklistAudit.hardStop && (
                        <span className="px-3 py-1 bg-rose-50 border border-rose-100 rounded-full text-[9px] font-black text-rose-500 uppercase flex items-center gap-1"><AlertOctagon size={12}/> Elegibilidade Crítica</span>
                      )}
                      <span className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black text-slate-500 uppercase">Auditado</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Checklist (35%)</p>
                      <p className="text-sm font-bold text-slate-700">{checklistAudit.score} / 100</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Audit. IA (45%)</p>
                      <p className="text-sm font-bold text-slate-700">{technicalScore.normalized} / 100</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Histórico (20%)</p>
                      <p className="text-sm font-bold text-slate-700">{historicalScore.normalized} / 100</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Confiança</p>
                      <p className="text-sm font-bold text-slate-700">{finalScoreResult.confidence}%</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Risco Glosa</p>
                      <p className={`text-sm font-bold ${
                        finalScoreResult.risk === 'BAIXO' ? 'text-emerald-600' : 
                        finalScoreResult.risk === 'MODERADO' ? 'text-amber-600' : 'text-rose-600'
                      }`}>{finalScoreResult.risk}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase">Completude Documental</span>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-500" style={{ width: `${finalScoreResult.completeness}%` }} />
                        </div>
                      </div>
                      <span className="text-xs font-black text-slate-900">{finalScoreResult.completeness.toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase">Consistência Técnica</span>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-500" style={{ width: `${finalScoreResult.consistency}%` }} />
                        </div>
                      </div>
                      <span className="text-xs font-black text-slate-900">{finalScoreResult.consistency.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 italic text-xs text-slate-500 leading-relaxed font-medium">
                    "Veredito final (SF: {finalScore}/100) consolidado. Integração de conformidade operacional (SD), evidência visual analisada via IA ({technicalScore.model}) e probabilidade empírica baseada em {historicalScore.count} casos similares registrados localmente."
                  </div>
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {isFavorable ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                  <div className="flex items-center gap-4 px-2">
                    <div className="h-0.5 flex-1 bg-slate-100" />
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Justificativa de Aprovação</h3>
                    <div className="h-0.5 flex-1 bg-slate-100" />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="aura-glass p-8 rounded-[40px] space-y-6">
                      <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        <FileCheck className="text-emerald-500" size={18} /> Resumo de Conformidade
                      </h4>
                      <div className="space-y-4">
                        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-xl">
                          <p className="text-xs font-bold text-emerald-800 uppercase mb-1">Elegibilidade Técnica</p>
                          <p className="text-[13px] text-emerald-700 font-medium">O componente {formData.componentePrincipal} obteve score técnico acumulado de {finalScore}/100, indicando conformidade histórica e visual com as regras da {formData.montadora}.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                            <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Risco Processual</span>
                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12}/> Baixíssimo</span>
                          </div>
                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                            <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Confiança Audit. IA</span>
                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1"><BrainCircuit size={12}/> {technicalScore.raw}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="aura-glass p-8 rounded-[40px] space-y-6">
                      <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        <ImageIcon className="text-brand-500" size={18} /> Evidências Auditadas
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        {formData.failureImages.length > 0 ? formData.failureImages.map((img, i) => (
                          <div key={i} className="aspect-video rounded-xl overflow-hidden bg-slate-100"><img src={img} className="w-full h-full object-cover" /></div>
                        )) : (
                          <div className="col-span-3 py-10 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                             <p className="text-[10px] font-bold text-slate-400 uppercase">Sem imagens vinculadas</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Relatório Técnico para Montadora */}
                  <div className="aura-glass p-10 rounded-[48px] border-t-[8px] border-brand-500 space-y-6 bg-brand-50/10">
                    <div className="flex justify-between items-start">
                      <h4 className="font-black text-slate-900 text-lg flex items-center gap-3">
                        <FileText className="text-brand-500" size={24} /> Relatório Técnico para Submissão (Montadora)
                      </h4>
                      <span className="text-[10px] font-black bg-white px-3 py-1 rounded-full border border-slate-200 text-slate-400 uppercase tracking-widest">Documento Interno</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Diagnóstico Consolidado</p>
                          <div className="p-5 bg-white rounded-3xl border border-slate-100 text-sm text-slate-700 leading-relaxed font-medium">
                            Conforme análise visual e histórica ({traceabilityNumber}), o veículo placa/VIN {formData.vin} apresenta falha no componente {formData.componentePrincipal}. A inspeção inicial confirmou {formData.inspecaoInicial.toLowerCase()}. O score de confiança técnica ({technicalScore.raw}%) valida a causa raiz como falha intrínseca de material, sem evidências de agente externo.
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Parecer do Auditor</p>
                          <div className="p-5 bg-white rounded-3xl border border-slate-100 text-sm text-slate-700 leading-relaxed font-medium">
                            O processo cumpre integralmente os requisitos do manual de garantia {formData.montadora}. Checklist regulatória (SD) em 40/40. Manutenção preventiva validada. Recomenda-se a submissão imediata para recuperação integral dos valores de peças (R$ {formData.pecas.reduce((acc, p) => acc + p.valor, 0).toLocaleString('pt-BR')}) e M.O.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                   <div className="flex items-center gap-4 px-2">
                    <div className="h-0.5 flex-1 bg-slate-100" />
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Relatório de Débito Prévio</h3>
                    <div className="h-0.5 flex-1 bg-slate-100" />
                  </div>
                  <div className="grid grid-cols-1 gap-8">
                    <div className="aura-glass p-12 rounded-[48px] border-t-[12px] border-rose-500 space-y-8">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <h4 className="text-xl font-black text-slate-900">Parecer Desfavorável</h4>
                          <p className="text-sm text-slate-500 font-medium italic">OS {formData.vin.slice(-5)} • Risco Calculado: {scoreClassification.probability}</p>
                        </div>
                        <ShieldAlert size={40} className="text-rose-500" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                          <div className="space-y-3">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resumo das Inconsistências</h5>
                            <p className="text-[15px] text-slate-700 leading-relaxed font-medium">
                              O processo acumulou apenas {finalScore} de 100 pontos possíveis. A dimensão técnica ({technicalScore.normalized}/50) e o histórico local ({historicalScore.normalized}/10) sugerem que o dano observado no componente {formData.componentePrincipal} possui baixa probabilidade de aceite pela montadora.
                            </p>
                          </div>
                        </div>
                        <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 space-y-4">
                          <h5 className="text-[10px] font-black text-brand-500 uppercase tracking-widest flex items-center gap-2">
                            <CheckCircle2 size={16} /> Recomendações Críticas
                          </h5>
                          <ul className="space-y-3">
                            {['Anexar laudo metalográfico especializado', 'Verificar histórico de telemetria/condução', 'Revisar se há boletins técnicos pendentes'].map((item, i) => (
                              <li key={i} className="flex gap-3 text-xs text-slate-600 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Justificativa de Recusa para o Cliente */}
                  <div className="aura-glass p-10 rounded-[48px] border-t-[8px] border-slate-900 space-y-6 bg-slate-50">
                    <div className="flex justify-between items-start">
                      <h4 className="font-black text-slate-900 text-lg flex items-center gap-3">
                        <ScanText className="text-slate-900" size={24} /> Termo de Justificativa para o Cliente
                      </h4>
                      <span className="text-[10px] font-black bg-white px-3 py-1 rounded-full border border-slate-200 text-slate-400 uppercase tracking-widest">Documento para Entrega</span>
                    </div>
                    <div className="p-8 bg-white rounded-[40px] border border-slate-100 space-y-6 shadow-sm">
                      <div className="flex flex-col md:flex-row gap-8 justify-between border-b border-slate-100 pb-6">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente / Veículo</p>
                          <p className="text-sm font-bold text-slate-800">{formData.modelo} - VIN: {formData.vin}</p>
                        </div>
                        <div className="space-y-1 text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocolo de Auditoria</p>
                          <p className="text-sm font-bold text-slate-800">{traceabilityNumber}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <p className="text-sm text-slate-700 leading-relaxed">
                          Prezado Cliente, informamos que após rigorosa auditoria técnica assistida por inteligência artificial e análise histórica de falhas, o reparo solicitado para o componente <strong>{formData.componentePrincipal}</strong> foi classificado como <strong>Não Passível de Garantia</strong>.
                        </p>
                        <div className="p-6 bg-slate-50 rounded-3xl space-y-3">
                          <h6 className="text-[10px] font-black text-slate-900 uppercase">Motivo Principal:</h6>
                          <p className="text-sm text-slate-600 font-medium italic">
                            "{aiGuidance?.pontosDeAtencao?.[0]?.descricao || 'Dano resultante de fatores externos ou desgaste operacional acima do limite técnico estabelecido pelo fabricante.'}"
                          </p>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                          Esta decisão baseia-se no manual de garantia da montadora {formData.montadora} e nos critérios de conformidade regulatória. Colocamo-nos à disposição para detalhamento técnico adicional através de nosso setor de serviços.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="max-w-[1300px] mx-auto">
      <div className="aura-glass p-6 rounded-[40px] shadow-sm mb-10 border-slate-50">
        <div className="flex justify-between items-center relative px-8">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>
          {STEPS.map((step, index) => (
            <div key={step.id} className="relative z-10 flex flex-col items-center group">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${index <= currentStep ? 'bg-brand-500 text-white shadow-xl shadow-brand-500/30 scale-110' : 'bg-white text-slate-300 border border-slate-100'}`}><step.icon size={20} /></div>
              <span className={`text-[10px] font-black mt-3 uppercase tracking-widest transition-colors ${index <= currentStep ? 'text-brand-500' : 'text-slate-400'}`}>{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      <motion.div key={currentStep} initial={{ opacity: 0, scale: 0.995 }} animate={{ opacity: 1, scale: 1 }} className="aura-glass p-12 rounded-[56px] shadow-sm min-h-[780px] flex flex-col border-slate-50">
        <div className="flex-1">{renderStepContent()}</div>
        <div className="flex justify-between items-center mt-12 pt-10 border-t border-slate-50">
          <button onClick={handleBack} disabled={currentStep === 0} className="flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-slate-400 hover:bg-slate-50 disabled:opacity-0 transition-all text-xs uppercase tracking-widest"><ChevronLeft size={18} /> Voltar</button>
          <button onClick={handleNext} className={`flex items-center gap-2 px-10 py-4 rounded-2xl font-black shadow-xl transition-all active:scale-95 text-xs uppercase tracking-widest ${currentStep === STEPS.length - 1 ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-900 text-white hover:bg-brand-500 shadow-slate-900/10'}`}>
            {currentStep === STEPS.length - 1 ? 'Finalizar Auditoria' : 'Próximo Passo'}
            <ChevronRight size={18} />
          </button>
        </div>
      </motion.div>
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }`}</style>
    </div>
  );
};

export default ProcessWizard;
