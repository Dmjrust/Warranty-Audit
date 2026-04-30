import {
  Controller, Get, Post, Patch, Param, Body, Query,
  UseGuards, Request, UploadedFiles, UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { WarrantyProcessService } from './warranty-process.service';
import { StorageService } from '@/modules/storage/storage.service';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { RoleGuard } from '@/modules/auth/guards/role.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { UserRole } from '@/shared/enums';
import { CreateProcessDto } from './dto/create-process.dto';
import {
  UpdateVehicleStepDto,
  UpdateChecklistStepDto,
  UpdateAnalysisStepDto,
  UpdateVerdictStepDto,
} from './dto/update-step.dto';

@Controller('processes')
@UseGuards(AuthGuard)
export class WarrantyProcessController {
  constructor(
    private processService: WarrantyProcessService,
    private storageService: StorageService,
  ) {}

  // POST /api/processes
  @Post()
  @UseGuards(RoleGuard)
  @Roles(UserRole.TECNICO, UserRole.GESTOR_GARANTIA, UserRole.ADMIN_TENANT, UserRole.ADMIN_PLATAFORMA)
  create(@Request() req: any, @Body() dto: CreateProcessDto) {
    return this.processService.create(req.user.tenantId, dto);
  }

  // GET /api/processes
  @Get()
  findAll(@Request() req: any, @Query('status') status?: string) {
    return this.processService.findAll(req.user.tenantId, { status });
  }

  // GET /api/processes/:id
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    const isAdmin = req.user.role === UserRole.ADMIN_PLATAFORMA;
    return this.processService.findOne(id, req.user.tenantId, isAdmin);
  }

  // PATCH /api/processes/:id/vehicle
  @Patch(':id/vehicle')
  saveVehicle(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: UpdateVehicleStepDto,
  ) {
    return this.processService.saveVehicleStep(id, req.user.tenantId, dto);
  }

  // PATCH /api/processes/:id/checklist
  @Patch(':id/checklist')
  saveChecklist(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: UpdateChecklistStepDto,
  ) {
    return this.processService.saveChecklistStep(id, req.user.tenantId, dto);
  }

  // PATCH /api/processes/:id/analysis
  @Patch(':id/analysis')
  saveAnalysis(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: UpdateAnalysisStepDto,
  ) {
    return this.processService.saveAnalysisStep(id, req.user.tenantId, dto);
  }

  // PATCH /api/processes/:id/verdict
  @Patch(':id/verdict')
  saveVerdict(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: UpdateVerdictStepDto,
  ) {
    return this.processService.saveVerdictStep(id, req.user.tenantId, dto);
  }

  // POST /api/processes/:id/images  (multipart upload)
  @Post(':id/images')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const urls = await Promise.all(
      files.map((f) => this.storageService.upload(f.buffer, f.originalname, f.mimetype)),
    );
    return { processId: id, imageUrls: urls };
  }
}
