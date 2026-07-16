import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenusController } from './menus.controller';
import { MenusService } from './menus.service';
import { Menu } from '../../entities/iam/menu.entity';
import { Permission } from '../../entities/iam/permission.entity';
import { Action } from '../../entities/iam/action.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Menu, Permission, Action])],
  controllers: [MenusController],
  providers: [MenusService],
  exports: [MenusService],
})
export class MenusModule {}
