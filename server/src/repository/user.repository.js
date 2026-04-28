import { query } from '../config/db.js';

export class UserRepository {
  async findById(id) {
    const result = await query(
      `SELECT u.id, u.email, u.username, u.is_active, u.created_at, u.updated_at, r.name as role
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async updateById(id, data) {
    const fields = [];
    const values = [id];
    let paramIndex = 2;

    if (data.username !== undefined) {
      fields.push(`username = $${paramIndex++}`);
      values.push(data.username);
    }
    if (data.email !== undefined) {
      fields.push(`email = $${paramIndex++}`);
      values.push(data.email);
    }
    if (data.password !== undefined) {
      fields.push(`password = $${paramIndex++}`);
      values.push(data.password);
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = NOW()`);
    const result = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $1 RETURNING id, email, username, is_active, updated_at`,
      values
    );
    return result.rows[0] || null;
  }

  async deleteById(id) {
    const result = await query(`DELETE FROM users WHERE id = $1 RETURNING id`, [id]);
    return result.rows[0] || null;
  }
}
