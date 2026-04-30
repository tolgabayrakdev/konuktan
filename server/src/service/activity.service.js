import { ActivityRepository } from '../repository/activity.repository.js';
import { NotFoundError } from '../exceptions/index.js';

const toResponse = (row) => ({
  id: row.id,
  customerId: row.customer_id,
  customerName: `${row.first_name} ${row.last_name}`,
  type: row.type,
  title: row.title,
  description: row.description,
  happenedAt: row.happened_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class ActivityService {
  constructor() {
    this.repo = new ActivityRepository();
  }

  async list({ userId, customerId, type, startDate, endDate, limit, offset }) {
    const { rows, total } = await this.repo.findAll({ userId, customerId, type, startDate, endDate, limit, offset });
    return {
      data: rows.map(toResponse),
      pagination: { limit, offset, total },
    };
  }

  async getOne(id, userId) {
    const row = await this.repo.findById(id, userId);
    if (!row) throw new NotFoundError('Aktivite bulunamadı');
    return toResponse(row);
  }

  async create(userId, body) {
    const row = await this.repo.create({ userId, ...body });
    return toResponse(row);
  }

  async update(id, userId, body) {
    const row = await this.repo.update(id, userId, body);
    if (!row) throw new NotFoundError('Aktivite bulunamadı');
    return toResponse(row);
  }

  async delete(id, userId) {
    const row = await this.repo.delete(id, userId);
    if (!row) throw new NotFoundError('Aktivite bulunamadı');
  }
}
