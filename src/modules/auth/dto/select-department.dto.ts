import {
  IsString,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
} from 'class-validator';

export class SelectDepartmentDto {
  @IsString()
  @IsOptional()
  departmentSelectionToken?: string;

  @IsNumberString()
  @IsNotEmpty()
  userDepartmentRoleId: string;
}
