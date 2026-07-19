import {
  IsString,
  IsIn,
  IsOptional,
  IsNumber,
  IsBoolean,
} from 'class-validator';

const MENU_TYPES = ['MAIN', 'MENU', 'BUTTON'] as const;

export class UpdateMenuDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  parentId?: string;

  @IsString()
  @IsOptional()
  nameTh?: string;

  @IsString()
  @IsOptional()
  nameEn?: string;

  @IsIn(MENU_TYPES)
  @IsOptional()
  menuType?: string;

  @IsString()
  @IsOptional()
  path?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
