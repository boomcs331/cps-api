import { IsNumberString, IsNotEmpty } from 'class-validator';

export class SwitchDepartmentDto {
  @IsNumberString()
  @IsNotEmpty()
  userDepartmentRoleId: string;
}
