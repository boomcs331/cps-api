import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ScopeType } from '../../../common/enums/scope-type.enum';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  nameTh: string;

  @IsString()
  @IsNotEmpty()
  nameEn: string;

  @IsEnum(ScopeType)
  @IsOptional()
  scopeType?: ScopeType;

  @IsString()
  @IsOptional()
  description?: string;
}
