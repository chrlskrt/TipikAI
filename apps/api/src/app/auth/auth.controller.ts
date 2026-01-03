import { Body, Controller, Post, Put, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegisterUserDto } from './dto/register-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthGuard } from '@nestjs/passport';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully.',
    example: {
      message: 'User registered successfully',
      data: {
        user: {
          id: 1,
          email: 'user@example.com',
          username: 'newuser',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        access_token: 'eyJhbGciOi',
        refresh_token: 'eyJhbGciOi',
      },
    },
  })
  async register(@Body() registerDto: RegisterUserDto) {
    const res = await this.authService.register(registerDto);
    return { message: 'User registered successfully', data: res };
  }

  @Post('login')
  @ApiOperation({ summary: 'Login a user' })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully.',
    example: {
      message: 'User logged in successfully',
      data: {
        user: {
          id: 1,
          email: 'user@example.com',
          username: 'existinguser',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        access_token: 'eyJhbGciOi',
        refresh_token: 'eyJhbGciOi',
      },
    },
  })
  async login(@Body() loginDto: LoginDto) {
    const res = await this.authService.login(loginDto);
    return { message: 'User logged in successfully', data: res };
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @Put('change-password')
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully.',
    example: {
      message: 'Password changed successfully',
    },
  })
  async changePassword(@Body() changePasswordDto: ChangePasswordDto) {
    console.log("shfhhdf:",changePasswordDto);
    await this.authService.changePassword(changePasswordDto);
    return { message: 'Password changed successfully' };
  }
}
