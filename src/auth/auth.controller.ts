
import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthDTO } from './auth.dto';
import { AuthService } from './auth.service';
import { API_PREFIX } from 'src/shared/constants';
import { JwtAuthGuard } from './jwt/jwt.guard';

@Controller(`${API_PREFIX}/auth`)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  async login(@Body() user: AuthDTO) {
    const response = await this.authService.validateUser(
      user.email,
      user.password,
    );
    if (response.success && response.errorCode==0) {
      return await this.authService.login(response.data);
    }else
      return response;
  }
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('/verify')
  async verifyToken(){
    
  }

}
