import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { ErrorCode } from '../../../common/enums/error-code.enum';
import { CustomHttpException } from '../../../common/exceptions/custom-exceptions';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get(
        'JWT_REFRESH_SECRET',
        'default-refresh-secret-key-change-in-production',
      ),
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub || !payload.sessionId) {
      throw new CustomHttpException(
        ErrorCode.SESSION_EXPIRED,
        'Invalid refresh token payload',
      );
    }

    return payload;
  }
}
