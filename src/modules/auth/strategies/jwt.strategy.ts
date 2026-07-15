import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { ErrorCode } from '../../../common/enums/error-code.enum';
import { CustomHttpException } from '../../../common/exceptions/custom-exceptions';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get(
        'JWT_ACCESS_SECRET',
        'default-secret-key-change-in-production',
      ),
    });
  }

  async validate(payload: JwtPayload) {
    // Basic validation - additional checks would be done in guards
    if (!payload.sub || !payload.sessionId) {
      throw new CustomHttpException(
        ErrorCode.SESSION_EXPIRED,
        'Invalid token payload',
      );
    }

    return {
      id: payload.sub,
      sessionId: payload.sessionId,
      activeUserDepartmentRoleId: payload.userDepartmentRoleId,
      activeDepartmentId: payload.departmentId,
      activeRoleCode: payload.roleCode,
      permissionVersion: payload.permissionVersion,
    };
  }
}
