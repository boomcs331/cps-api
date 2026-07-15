import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../entities/iam/audit-log.entity';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 20,
    userId?: string,
    action?: string,
  ) {
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('audit')
      .leftJoinAndSelect('audit.actorUser', 'user')
      .select([
        'audit.id',
        'audit.action',
        'audit.targetType',
        'audit.targetId',
        'audit.createdAt',
        'audit.ipAddress',
        'user.id',
        'user.username',
        'user.firstName',
        'user.lastName',
      ]);

    if (userId) {
      queryBuilder.andWhere('audit.actorUserId = :userId', { userId });
    }

    if (action) {
      queryBuilder.andWhere('audit.action ILIKE :action', {
        action: `%${action}%`,
      });
    }

    queryBuilder.orderBy('audit.createdAt', 'DESC');

    const [items, totalItems] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
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
    const auditLog = await this.auditLogRepository.findOne({
      where: { id },
      relations: ['actorUser'],
    });
    if (!auditLog) {
      throw new Error('Audit log not found');
    }
    return auditLog;
  }
}
