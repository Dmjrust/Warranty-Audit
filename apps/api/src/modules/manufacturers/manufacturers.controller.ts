import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ManufacturersService } from './manufacturers.service';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';

@Controller('manufacturers')
@UseGuards(AuthGuard)
export class ManufacturersController {
  constructor(private service: ManufacturersService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/policy-versions')
  getPolicyVersions(@Param('id') id: string) {
    return this.service.getPolicyVersions(id);
  }
}
