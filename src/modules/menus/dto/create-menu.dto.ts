import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsIn,
  IsArray,
  ValidateNested,
} from 'class-validator';

export class CreateMenuPermissionDto {
  @IsString()
  @IsNotEmpty()
  permissionCode: string;

  @IsString()
  @IsNotEmpty()
  permissionName: string;

  @IsString()
  @IsNotEmpty()
  resource: string;

  @IsString()
  @IsNotEmpty()
  action: string;
}

export class CreateSubMenuDto {
  @IsString()
  @IsNotEmpty()
  menuCode: string;

  @IsString()
  @IsNotEmpty()
  menuName: string;

  @IsIn(['SUB_MENU'])
  @IsOptional()
  menuType?: string;

  @IsString()
  @IsOptional()
  path?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateMenuPermissionDto)
  permissions?: CreateMenuPermissionDto[];
}

export class CreateMenuDto {
  @IsString()
  @IsNotEmpty()
  menuCode: string;

  @IsString()
  @IsNotEmpty()
  menuName: string;

  @IsIn(['MAIN_MENU', 'SUB_MENU'])
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

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateMenuPermissionDto)
  permissions?: CreateMenuPermissionDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateSubMenuDto)
  submenus?: CreateSubMenuDto[];
}
