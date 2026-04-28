import { query } from '../config/db.js';

export class CustomerRepository {
  async findAll({ userId, search, status, limit, offset }) {
    const conditions = ['c.user_id = $1'];
    const values = [userId];
    let idx = 2;

    if (status) {
      conditions.push(`c.status = $${idx++}`);
      values.push(status);
    }

    if (search) {
      conditions.push(`(
        c.first_name ILIKE $${idx} OR
        c.last_name ILIKE $${idx} OR
        c.email ILIKE $${idx} OR
        c.company ILIKE $${idx} OR
        c.city ILIKE $${idx} OR
        c.phone ILIKE $${idx}
      )`);
      values.push(`%${search}%`);
      idx++;
    }

    const where = conditions.join(' AND ');

    const countResult = await query(
      `SELECT COUNT(*) FROM customers c WHERE ${where}`,
      values
    );
    const total = parseInt(countResult.rows[0].count, 10);

    values.push(limit, offset);
    const result = await query(
      `SELECT c.id, c.user_id, c.first_name, c.last_name, c.email, c.phone,
              c.company, c.city, c.status, c.notes, c.created_at, c.updated_at
       FROM customers c
       WHERE ${where}
       ORDER BY c.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      values
    );

    return { rows: result.rows, total };
  }

  async findById(id, userId) {
    const result = await query(
      `SELECT id, user_id, first_name, last_name, email, phone,
              company, city, status, notes, created_at, updated_at
       FROM customers
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    return result.rows[0] || null;
  }

  async create({ userId, firstName, lastName, email, phone, company, city, status, notes }) {
    const result = await query(
      `INSERT INTO customers (user_id, first_name, last_name, email, phone, company, city, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, user_id, first_name, last_name, email, phone, company, city, status, notes, created_at, updated_at`,
      [userId, firstName, lastName, email || null, phone || null, company || null, city || null, status, notes || null]
    );
    return result.rows[0];
  }

  async update(id, userId, data) {
    const fieldMap = {
      firstName: 'first_name',
      lastName: 'last_name',
      email: 'email',
      phone: 'phone',
      company: 'company',
      city: 'city',
      status: 'status',
      notes: 'notes',
    };

    const fields = [];
    const values = [id, userId];
    let idx = 3;

    for (const [key, col] of Object.entries(fieldMap)) {
      if (data[key] !== undefined) {
        fields.push(`${col} = $${idx++}`);
        values.push(data[key] === '' ? null : data[key]);
      }
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = NOW()`);
    const result = await query(
      `UPDATE customers SET ${fields.join(', ')}
       WHERE id = $1 AND user_id = $2
       RETURNING id, user_id, first_name, last_name, email, phone, company, city, status, notes, created_at, updated_at`,
      values
    );
    return result.rows[0] || null;
  }

  async delete(id, userId) {
    const result = await query(
      `DELETE FROM customers WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );
    return result.rows[0] || null;
  }
}
