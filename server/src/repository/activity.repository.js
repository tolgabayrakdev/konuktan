import { query } from '../config/db.js';

export class ActivityRepository {
  async findAll({ userId, customerId, type, startDate, endDate, limit, offset }) {
    const conditions = ['a.user_id = $1'];
    const values = [userId];
    let idx = 2;

    if (customerId) {
      conditions.push(`a.customer_id = $${idx++}`);
      values.push(customerId);
    }

    if (type) {
      conditions.push(`a.type = $${idx++}`);
      values.push(type);
    }

    if (startDate) {
      conditions.push(`a.happened_at >= $${idx++}`);
      values.push(startDate);
    }

    if (endDate) {
      conditions.push(`a.happened_at <= $${idx++}`);
      values.push(endDate);
    }

    const where = conditions.join(' AND ');

    const countResult = await query(
      `SELECT COUNT(*) FROM activities a WHERE ${where}`,
      values
    );
    const total = parseInt(countResult.rows[0].count, 10);

    values.push(limit, offset);

    const result = await query(
      `SELECT
         a.id, a.user_id, a.customer_id, a.type, a.title, a.description,
         a.happened_at, a.created_at, a.updated_at,
         c.first_name, c.last_name
       FROM activities a
       JOIN customers c ON a.customer_id = c.id
       WHERE ${where}
       ORDER BY a.happened_at DESC, a.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      values
    );

    return { rows: result.rows, total };
  }

  async findById(id, userId) {
    const result = await query(
      `SELECT
         a.id, a.user_id, a.customer_id, a.type, a.title, a.description,
         a.happened_at, a.created_at, a.updated_at,
         c.first_name, c.last_name
       FROM activities a
       JOIN customers c ON a.customer_id = c.id
       WHERE a.id = $1 AND a.user_id = $2`,
      [id, userId]
    );
    return result.rows[0] || null;
  }

  async create({ userId, customerId, type, title, description, happenedAt }) {
    const result = await query(
      `INSERT INTO activities (user_id, customer_id, type, title, description, happened_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, customer_id, type, title, description, happened_at, created_at, updated_at`,
      [userId, customerId, type, title, description || null, happenedAt || new Date()]
    );
    const row = result.rows[0];
    const full = await this.findById(row.id, userId);
    return full;
  }

  async update(id, userId, data) {
    const fields = [];
    const values = [id, userId];
    let idx = 3;

    if (data.type !== undefined) { fields.push(`type = $${idx++}`); values.push(data.type); }
    if (data.title !== undefined) { fields.push(`title = $${idx++}`); values.push(data.title); }
    if (data.description !== undefined) { fields.push(`description = $${idx++}`); values.push(data.description || null); }
    if (data.happenedAt !== undefined) { fields.push(`happened_at = $${idx++}`); values.push(data.happenedAt); }

    if (fields.length === 0) return null;
    fields.push(`updated_at = NOW()`);

    const result = await query(
      `UPDATE activities SET ${fields.join(', ')}
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      values
    );
    if (!result.rows[0]) return null;
    return this.findById(result.rows[0].id, userId);
  }

  async delete(id, userId) {
    const result = await query(
      `DELETE FROM activities WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );
    return result.rows[0] || null;
  }
}
