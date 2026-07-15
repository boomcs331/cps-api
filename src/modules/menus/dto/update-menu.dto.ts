import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { MenuType } from '../../../common/enums/menu-type.enum';

export class UpdateMenuDto {
  @IsString()
  @IsOptional()
  parentId?: string;

  @IsString()
  @IsOptional()
  nameTh?: string;

  @IsString()
  @IsOptional()
  nameEn?: string;

  @IsEnum(MenuType)
  @IsOptional()
  menuType?: MenuType;

  @IsString()
  @IsOptional()
  path?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}
