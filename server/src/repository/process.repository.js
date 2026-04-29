import { query } from '../config/db.js';

export class ProcessRepository {
  async findAll({ userId, customerId }) {
    const conditions = ['p.user_id = $1'];
    const values = [userId];
    let idx = 2;

    if (customerId) {
      conditions.push(`p.customer_id = $${idx++}`);
      values.push(customerId);
    }

    const result = await query(
      `SELECT
         p.id, p.user_id, p.customer_id, p.title, p.description,
         p.stage, p.position, p.created_at, p.updated_at,
         c.first_name, c.last_name
       FROM processes p
       JOIN customers c ON p.customer_id = c.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY p.stage, p.position ASC, p.created_at ASC`,
      values
    );
    return result.rows;
  }

  async findById(id, userId) {
    const result = await query(
      `SELECT p.id, p.user_id, p.customer_id, p.title, p.description,
              p.stage, p.position, p.created_at, p.updated_at,
              c.first_name, c.last_name
       FROM processes p
       JOIN customers c ON p.customer_id = c.id
       WHERE p.id = $1 AND p.user_id = $2`,
      [id, userId]
    );
    return result.rows[0] || null;
  }

  async getMaxPosition(userId, stage) {
    const result = await query(
      `SELECT COALESCE(MAX(position), -1) as max_pos
       FROM processes WHERE user_id = $1 AND stage = $2`,
      [userId, stage]
    );
    return result.rows[0].max_pos;
  }

  async create({ userId, customerId, title, description, stage, position }) {
    const result = await query(
      `INSERT INTO processes (user_id, customer_id, title, description, stage, position)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, customer_id, title, description, stage, position, created_at, updated_at`,
      [userId, customerId, title, description || null, stage, position]
    );
    return result.rows[0];
  }

  async update(id, userId, data) {
    const fields = [];
    const values = [id, userId];
    let idx = 3;

    if (data.title !== undefined) { fields.push(`title = $${idx++}`); values.push(data.title); }
    if (data.description !== undefined) { fields.push(`description = $${idx++}`); values.push(data.description || null); }
    if (data.stage !== undefined) { fields.push(`stage = $${idx++}`); values.push(data.stage); }
    if (data.position !== undefined) { fields.push(`position = $${idx++}`); values.push(data.position); }

    if (fields.length === 0) return null;
    fields.push(`updated_at = NOW()`);

    const result = await query(
      `UPDATE processes SET ${fields.join(', ')}
       WHERE id = $1 AND user_id = $2
       RETURNING id, user_id, customer_id, title, description, stage, position, created_at, updated_at`,
      values
    );
    return result.rows[0] || null;
  }

  async delete(id, userId) {
    const result = await query(
      `DELETE FROM processes WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );
    return result.rows[0] || null;
  }
}
