import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ScopeType } from '../../../common/enums/scope-type.enum';

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  nameTh?: string;

  @IsString()
  @IsOptional()
  nameEn?: string;

  @IsEnum(ScopeType)
  @IsOptional()
  scopeType?: ScopeType;

  @IsString()
  @IsOptional()
  description?: string;
}
