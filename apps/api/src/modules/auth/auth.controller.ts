import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('invite/accept')
  acceptInvite(@Body() body: { token: string; name: string; password: string }) {
    return this.authService.acceptInvite(body.token, body.name, body.password);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@Request() req: any) {
    return this.authService.me(req.user.id);
  }
}
