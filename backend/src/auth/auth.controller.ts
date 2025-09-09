import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  // Si quieres devolver JWT “oficial”
  @Post('login')
  login(@Body() dto: LoginDto) {
    // devuelve: { access_token, sub, name, role }
    return this.service.login(dto.email, dto.password);
  }

  // Si quieres mantener también el método viejo (opcional)
  // @Post('login-legacy')
  // loginLegacy(@Body() dto: LoginDto) {
  //   return this.service.validateLogin(dto.email, dto.password);
  // }
}
