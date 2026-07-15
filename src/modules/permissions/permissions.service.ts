import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../../entities/iam/permission.entity';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}

  async findAll(page: number = 1, limit: number = 20, search?: string) {
    const queryBuilder = this.permissionRepository
      .createQueryBuilder('permission')
      .leftJoinAndSelect('permission.menu', 'menu')
      .leftJoinAndSelect('permission.action', 'action')
      .select([
        'permission.id',
        'permission.code',
        'permission.isActive',
        'permission.createdAt',
        'menu.id',
        'menu.code',
        'menu.nameTh',
        'menu.nameEn',
        'action.id',
        'action.code',
        'action.nameTh',
        'action.nameEn',
      ]);

    if (search) {
      queryBuilder.andWhere(
        '(permission.code ILIKE :search OR menu.code ILIKE :search OR action.code ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [items, totalItems] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('permission.createdAt', 'DESC')
      .getManyAndCount();

    return {
      items,
      meta: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  async findOne(id: string) {
    const permission = await this.permissionRepository.findOne({
      where: { id },
      relations: ['menu', 'action'],
    });
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }
    return permission;
  }
}
