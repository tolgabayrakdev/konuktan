import { ProcessRepository } from '../repository/process.repository.js';
import { NotFoundError } from '../exceptions/index.js';

const toResponse = (row) => ({
  id: row.id,
  customerId: row.customer_id,
  customerName: `${row.first_name} ${row.last_name}`,
  title: row.title,
  description: row.description,
  stage: row.stage,
  position: row.position,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class ProcessService {
  constructor() {
    this.repo = new ProcessRepository();
  }

  async list({ userId, customerId }) {
    const rows = await this.repo.findAll({ userId, customerId });
    return rows.map(toResponse);
  }

  async create(userId, { customerId, title, description, stage = 'todo' }) {
    const maxPos = await this.repo.getMaxPosition(userId, stage);
    const row = await this.repo.create({
      userId,
      customerId,
      title,
      description,
      stage,
      position: maxPos + 1,
    });
    // fetch with customer name
    const full = await this.repo.findById(row.id, userId);
    return toResponse(full);
  }

  async update(id, userId, data) {
    // if stage changes, move to end of new stage
    if (data.stage && data.position === undefined) {
      const maxPos = await this.repo.getMaxPosition(userId, data.stage);
      data.position = maxPos + 1;
    }
    const row = await this.repo.update(id, userId, data);
    if (!row) throw new NotFoundError('Süreç bulunamadı');
    const full = await this.repo.findById(row.id, userId);
    return toResponse(full);
  }

  async delete(id, userId) {
    const row = await this.repo.delete(id, userId);
    if (!row) throw new NotFoundError('Süreç bulunamadı');
  }
}
