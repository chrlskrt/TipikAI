import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Kysely } from 'kysely';
import { DB } from 'src/database/db';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AccessTokenPayload } from 'src/common/types/jwt.types';
import { getCurrentRequest } from 'src/common/utils/request-context';
import { LoginDto } from './dto/login.dto';

export interface JwtPayload {
  sub: number;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject('DATABASE') private readonly db: Kysely<DB>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterUserDto) {
    const existingUsers = await this.db
      .selectFrom('authentication.users')
      .select(['id', 'email', 'username'])
      .where((eb) =>
        eb.or([
          eb('email', '=', registerDto.email),
          eb('username', '=', registerDto.username),
        ]),
      )
      .execute();

    if (existingUsers.length > 0) {
      const hasEmailConflict = existingUsers.some(
        (user) => user.email === registerDto.email,
      );
      const hasUsernameConflict = existingUsers.some(
        (user) => user.username === registerDto.username,
      );

      if (hasEmailConflict && hasUsernameConflict) {
        throw new ConflictException('Email and username are already in use.');
      } else if (hasEmailConflict) {
        throw new ConflictException('Email is already in use.');
      } else if (hasUsernameConflict) {
        throw new ConflictException('Username is already in use.');
      }
    }

    const saltRounds = 12;
    const hashedPassword: string = await (
      bcrypt as { hash: (data: string, salt: number) => Promise<string> }
    ).hash(registerDto.password, saltRounds);

    const { password, ...userData } = registerDto;

    const newUser = await this.db
      .insertInto('authentication.users')
      .values({
        ...userData,
        password_hash: hashedPassword,
      })
      .returning([
        'id',
        'email',
        'username',
        'created_at as createdAt',
        'updated_at as updatedAt',
      ])
      .executeTakeFirst();

    if (!newUser) {
      throw new Error('User registration failed.');
    }

    const dbRole = await this.db
      .selectFrom('authentication.roles')
      .selectAll()
      .where('name', '=', 'normal')
      .executeTakeFirst();

    if (!dbRole) {
      throw new Error('Default role not found.');
    }

    await this.db
      .insertInto('authentication.user_roles')
      .values({
        user_id: newUser.id,
        role_id: dbRole.id,
      })
      .execute();

    const tokens = await this.generateTokens(
      newUser.id,
      newUser.email,
      newUser.username,
    );

    return {
      user: newUser,
      ...tokens,
    };
  }

  async changePassword(changePasswordDto: ChangePasswordDto) {
    const req = getCurrentRequest();
    const user = req['user'];

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const saltRounds = 12;

    // Verify password
    const isPasswordValid: boolean = await (
      bcrypt as {
        compare: (data: string, encrypted: string) => Promise<boolean>;
      }
    ).compare(changePasswordDto.currentPassword, user.password_hash);

    if (!isPasswordValid) {
      throw new NotFoundException('Current password is incorrect.');
    }

    // Check if new password is different from current password
    const isNewPasswordSame: boolean = await (
      bcrypt as {
        compare: (data: string, encrypted: string) => Promise<boolean>;
      }
    ).compare(changePasswordDto.newPassword, user.password_hash);

    if (isNewPasswordSame) {
      throw new ConflictException(
        'New password must be different from the current password.',
      );
    }

    const newHashedPassword: string = await (
      bcrypt as { hash: (data: string, salt: number) => Promise<string> }
    ).hash(changePasswordDto.newPassword, saltRounds);

    await this.db
      .updateTable('authentication.users')
      .set({ password_hash: newHashedPassword })
      .where('id', '=', user.id)
      .execute();

    return;
  }

  async login(loginDto: LoginDto) {
    const saltRounds = 12;
    const hashedPassword: string = await (
      bcrypt as { hash: (data: string, salt: number) => Promise<string> }
    ).hash(loginDto.password, saltRounds);

    const user = await this.db
      .selectFrom('authentication.users')
      .select([
        'id',
        'email',
        'username',
        'password_hash',
        'created_at as createdAt',
        'updated_at as updatedAt',
      ])
      .where('email', '=', loginDto.email)
      .executeTakeFirstOrThrow(
        () =>
          new NotFoundException(
            'Email or password is incorrect. Please try again.',
          ),
      );

    // Verify password
    const isPasswordValid: boolean = await (
      bcrypt as {
        compare: (data: string, encrypted: string) => Promise<boolean>;
      }
    ).compare(loginDto.password, user.password_hash);

    if (!isPasswordValid) {
      throw new NotFoundException(
        'Email or password is incorrect. Please try again.',
      );
    }

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.username,
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      ...tokens,
    };
  }

  // getting user from JWT payload (getCurrentUser decorator)
  async validateUser(payload: { sub: string; email: string }) {
    const user = await this.db
      .selectFrom('authentication.users')
      .selectAll()
      .where('id', '=', payload.sub)
      .executeTakeFirstOrThrow(
        () => new NotFoundException('User does not exist.'),
      );

    return user;
  }

  private async generateTokens(
    userId: string,
    email: string,
    username: string,
  ) {
    const accessTokenPayload: AccessTokenPayload = {
      sub: userId.toString(),
      email,
      username,
    };

    const accessToken = this.jwtService.sign(accessTokenPayload);

    const refreshToken = crypto.randomBytes(64).toString('hex');

    await this.db
      .insertInto('authentication.refresh_tokens')
      .values({
        user_id: userId,
        token: refreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        revoked: false,
      })
      .execute();

    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
  }
}
