// Typed wrappers over the warranty-process API endpoints

export interface ProcessSummary {
  id: string;
  status: string;
  currentStep: string;
  slaStatus: string;
  slaDeadline: string | null;
  createdAt: string;
  policyVersion: { id: string; versionCode: string; manufacturer: { name: string } } | null;
  vehicleData: any;
  latestScore: { scoreFinal: number } | null;
}

export interface ChecklistItem {
  id: string;
  pergunta: string;
  tipo: string;
  impacto_sd: number;
  bloqueante: boolean;
  orientacao?: string;
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function req(method: string, path: string, token: string, body?: unknown) {
  const res = await fetch(`${API}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? 'API error');
  }
  return res.json();
}

export const processApi = {
  list: (token: string, status?: string): Promise<ProcessSummary[]> =>
    req('GET', `/processes${status ? `?status=${status}` : ''}`, token),

  get: (token: string, id: string) =>
    req('GET', `/processes/${id}`, token),

  create: (token: string, body?: { observacoes?: string }) =>
    req('POST', '/processes', token, body ?? {}),

  saveVehicle: (token: string, id: string, data: object) =>
    req('PATCH', `/processes/${id}/vehicle`, token, data),

  saveChecklist: (token: string, id: string, answers: Array<{ questionId: string; answer: any }>) =>
    req('PATCH', `/processes/${id}/checklist`, token, { answers }),

  saveAnalysis: (token: string, id: string, data: object) =>
    req('PATCH', `/processes/${id}/analysis`, token, data),

  saveVerdict: (token: string, id: string, data: { scoreSt?: number | null; scoreSh?: number | null }) =>
    req('PATCH', `/processes/${id}/verdict`, token, data),

  getHistoryScore: (token: string): Promise<{ scoreSh: number }> =>
    req('GET', '/processes/history-score', token),

  getChecklist: (token: string, policyVersionId: string): Promise<{ items: ChecklistItem[] }> =>
    req('GET', `/policies/${policyVersionId}/checklist`, token),

  validateEligibility: (token: string, policyVersionId: string, vehicle: object) =>
    req('POST', `/policies/${policyVersionId}/validate-eligibility`, token, vehicle),

  uploadImages: async (token: string, processId: string, files: File[]): Promise<string[]> => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    const res = await fetch(`${API}/api/processes/${processId}/images`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!res.ok) throw new Error('Falha no upload de imagens');
    const data = await res.json();
    return data.imageUrls;
  },
};
