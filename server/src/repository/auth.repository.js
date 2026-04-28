import { query } from '../config/db.js';

export class AuthRepository {
  async findUserByEmail(email) {
    const result = await query(
      `SELECT u.id, u.email, u.username, u.password, u.is_active, u.is_verified, r.name as role
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.email = $1`,
      [email]
    );
    return result.rows[0] || null;
  }

  async findUserById(id) {
    const result = await query(
      `SELECT u.id, u.email, u.username, u.is_active, u.is_verified, r.name as role
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async findUserByUsername(username) {
    const result = await query(`SELECT u.id FROM users u WHERE u.username = $1`, [username]);
    return result.rows[0] || null;
  }

  async createUser({ email, username, password, roleId }) {
    const result = await query(
      `INSERT INTO users (email, username, password, role_id) VALUES ($1, $2, $3, $4) RETURNING id, email, username, is_active, is_verified, created_at`,
      [email, username, password, roleId]
    );
    return result.rows[0];
  }

  async verifyUser(userId) {
    const result = await query(
      `UPDATE users SET is_verified = TRUE, is_active = TRUE, updated_at = NOW() WHERE id = $1 RETURNING id, email, username, is_active, is_verified`,
      [userId]
    );
    return result.rows[0] || null;
  }

  async findRoleByName(name) {
    const result = await query(`SELECT id, name FROM roles WHERE name = $1`, [name]);
    return result.rows[0] || null;
  }

  async saveVerificationCode({ userId, code, expiresAt }) {
    const result = await query(
      `INSERT INTO verification_codes (user_id, code, expires_at) VALUES ($1, $2, $3) RETURNING id`,
      [userId, code, expiresAt]
    );
    return result.rows[0];
  }

  async findVerificationCode(userId, code) {
    const result = await query(
      `SELECT id, user_id, code, expires_at FROM verification_codes WHERE user_id = $1 AND code = $2 AND expires_at > NOW()`,
      [userId, code]
    );
    return result.rows[0] || null;
  }

  async deleteVerificationCodesByUserId(userId) {
    await query(`DELETE FROM verification_codes WHERE user_id = $1`, [userId]);
  }

  async saveRefreshToken({ userId, token, expiresAt }) {
    const result = await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING id`,
      [userId, token, expiresAt]
    );
    return result.rows[0];
  }

  async findRefreshToken(token) {
    const result = await query(
      `SELECT rt.id, rt.user_id, rt.expires_at, u.email, u.username, u.is_active, u.is_verified, r.name as role
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       JOIN roles r ON u.role_id = r.id
       WHERE rt.token = $1`,
      [token]
    );
    return result.rows[0] || null;
  }

  async deleteRefreshToken(token) {
    await query(`DELETE FROM refresh_tokens WHERE token = $1`, [token]);
  }

  async deleteRefreshTokensByUserId(userId) {
    await query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [userId]);
  }

  async savePasswordResetToken({ userId, token, expiresAt }) {
    const result = await query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING id`,
      [userId, token, expiresAt]
    );
    return result.rows[0];
  }

  async findPasswordResetToken(token) {
    const result = await query(
      `SELECT id, user_id, expires_at FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW() AND used_at IS NULL`,
      [token]
    );
    return result.rows[0] || null;
  }

  async markPasswordResetTokenUsed(id) {
    await query(`UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1`, [id]);
  }

  async deletePasswordResetTokensByUserId(userId) {
    await query(`DELETE FROM password_reset_tokens WHERE user_id = $1`, [userId]);
  }
}
