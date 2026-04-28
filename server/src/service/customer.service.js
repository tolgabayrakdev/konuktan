import { CustomerRepository } from '../repository/customer.repository.js';
import { NotFoundError } from '../exceptions/index.js';

const toResponse = (row) => ({
  id: row.id,
  firstName: row.first_name,
  lastName: row.last_name,
  email: row.email,
  phone: row.phone,
  company: row.company,
  city: row.city,
  status: row.status,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class CustomerService {
  constructor() {
    this.repo = new CustomerRepository();
  }

  async list({ userId, search, status, page, limit }) {
    const offset = (page - 1) * limit;
    const { rows, total } = await this.repo.findAll({ userId, search, status, limit, offset });
    return {
      data: rows.map(toResponse),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getOne(id, userId) {
    const row = await this.repo.findById(id, userId);
    if (!row) throw new NotFoundError('Customer not found');
    return toResponse(row);
  }

  async create(userId, body) {
    const row = await this.repo.create({ userId, ...body });
    return toResponse(row);
  }

  async update(id, userId, body) {
    const row = await this.repo.update(id, userId, body);
    if (!row) throw new NotFoundError('Customer not found');
    return toResponse(row);
  }

  async delete(id, userId) {
    const row = await this.repo.delete(id, userId);
    if (!row) throw new NotFoundError('Customer not found');
  }
}
