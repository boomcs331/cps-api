import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Menu } from '../../entities/iam/menu.entity';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { DuplicateResourceException } from '../../common/exceptions/custom-exceptions';

@Injectable()
export class MenusService {
  constructor(
    @InjectRepository(Menu)
    private menuRepository: Repository<Menu>,
  ) {}

  async findAll(page: number = 1, limit: number = 20, search?: string) {
    const queryBuilder = this.menuRepository
      .createQueryBuilder('menu')
      .leftJoinAndSelect('menu.parent', 'parent')
      .select([
        'menu.id',
        'menu.code',
        'menu.nameTh',
        'menu.nameEn',
        'menu.menuType',
        'menu.path',
        'menu.icon',
        'menu.sortOrder',
        'menu.isVisible',
        'menu.isActive',
        'menu.createdAt',
        'parent.id',
        'parent.code',
        'parent.nameTh',
      ]);

    if (search) {
      queryBuilder.andWhere(
        '(menu.code ILIKE :search OR menu.nameTh ILIKE :search OR menu.nameEn ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [items, totalItems] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('menu.sortOrder', 'ASC')
      .addOrderBy('menu.createdAt', 'DESC')
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

  async findTree() {
    const menus = await this.menuRepository
      .createQueryBuilder('menu')
      .leftJoinAndSelect('menu.parent', 'parent')
      .where('menu.isActive = :isActive', { isActive: true })
      .andWhere('menu.isVisible = :isVisible', { isVisible: true })
      .orderBy('menu.sortOrder', 'ASC')
      .addOrderBy('menu.createdAt', 'ASC')
      .getMany();

    // Build tree structure
    const menuMap = new Map();
    menus.forEach((menu) => menuMap.set(menu.id, { ...menu, children: [] }));

    const rootMenus: any[] = [];
    menus.forEach((menu) => {
      if (menu.parentId) {
        const parent = menuMap.get(menu.parentId);
        if (parent) {
          parent.children.push(menuMap.get(menu.id));
        }
      } else {
        rootMenus.push(menuMap.get(menu.id));
      }
    });

    return rootMenus;
  }

  async findOne(id: string) {
    const menu = await this.menuRepository.findOne({
      where: { id },
      relations: ['parent'],
    });
    if (!menu) {
      throw new NotFoundException('Menu not found');
    }
    return menu;
  }

  async create(createMenuDto: CreateMenuDto) {
    const existing = await this.menuRepository.findOne({
      where: { code: createMenuDto.code },
    });

    if (existing) {
      throw new DuplicateResourceException('Menu code');
    }

    const menu = this.menuRepository.create(createMenuDto);
    return this.menuRepository.save(menu);
  }

  async update(id: string, updateMenuDto: UpdateMenuDto) {
    const menu = await this.findOne(id);
    Object.assign(menu, updateMenuDto);
    return this.menuRepository.save(menu);
  }

  async remove(id: string) {
    const menu = await this.findOne(id);

    // Check if menu has children
    const childCount = await this.menuRepository.count({
      where: { parentId: id },
    });

    if (childCount > 0) {
      throw new Error('Cannot delete menu with child menus');
    }

    await this.menuRepository.remove(menu);
    return { message: 'Menu deleted successfully' };
  }
}
