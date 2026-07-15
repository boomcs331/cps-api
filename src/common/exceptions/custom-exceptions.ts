import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../enums/error-code.enum';

export class CustomHttpException extends HttpException {
  constructor(
    code: ErrorCode,
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    path?: string,
  ) {
    super(
      {
        statusCode,
        error: HttpStatus[statusCode],
        code,
        message,
        path,
        timestamp: new Date().toISOString(),
      },
      statusCode,
    );
  }
}

export class InvalidCredentialsException extends CustomHttpException {
  constructor(path?: string) {
    super(
      ErrorCode.INVALID_CREDENTIALS,
      'Invalid username or password',
      HttpStatus.UNAUTHORIZED,
      path,
    );
  }
}

export class UserInactiveException extends CustomHttpException {
  constructor(path?: string) {
    super(
      ErrorCode.USER_INACTIVE,
      'User account is inactive',
      HttpStatus.FORBIDDEN,
      path,
    );
  }
}

export class UserLockedException extends CustomHttpException {
  constructor(path?: string) {
    super(
      ErrorCode.USER_LOCKED,
      'User account is locked',
      HttpStatus.FORBIDDEN,
      path,
    );
  }
}

export class DepartmentSelectionRequiredException extends CustomHttpException {
  constructor(path?: string) {
    super(
      ErrorCode.DEPARTMENT_SELECTION_REQUIRED,
      'Department selection is required',
      HttpStatus.FORBIDDEN,
      path,
    );
  }
}

export class PermissionDeniedException extends CustomHttpException {
  constructor(path?: string) {
    super(
      ErrorCode.PERMISSION_DENIED,
      'You do not have permission to perform this action',
      HttpStatus.FORBIDDEN,
      path,
    );
  }
}

export class SessionExpiredException extends CustomHttpException {
  constructor(path?: string) {
    super(
      ErrorCode.SESSION_EXPIRED,
      'Session has expired',
      HttpStatus.UNAUTHORIZED,
      path,
    );
  }
}

export class SessionRevokedException extends CustomHttpException {
  constructor(path?: string) {
    super(
      ErrorCode.SESSION_REVOKED,
      'Session has been revoked',
      HttpStatus.UNAUTHORIZED,
      path,
    );
  }
}

export class DuplicateResourceException extends CustomHttpException {
  constructor(resource: string, path?: string) {
    super(
      ErrorCode.DUPLICATE_USERNAME,
      `${resource} already exists`,
      HttpStatus.CONFLICT,
      path,
    );
  }
}

export class LastSuperAdminProtectedException extends CustomHttpException {
  constructor(path?: string) {
    super(
      ErrorCode.LAST_SUPER_ADMIN_PROTECTED,
      'Cannot modify the last super admin account',
      HttpStatus.FORBIDDEN,
      path,
    );
  }
}

export class AssignmentInactiveException extends CustomHttpException {
  constructor(path?: string) {
    super(
      ErrorCode.ASSIGNMENT_INACTIVE,
      'User department assignment is inactive',
      HttpStatus.FORBIDDEN,
      path,
    );
  }
}

export class AssignmentExpiredException extends CustomHttpException {
  constructor(path?: string) {
    super(
      ErrorCode.ASSIGNMENT_EXPIRED,
      'User department assignment has expired',
      HttpStatus.FORBIDDEN,
      path,
    );
  }
}
