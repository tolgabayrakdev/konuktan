import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { AuthRepository } from '../repository/auth.repository.js';
import { UserRepository } from '../repository/user.repository.js';
import { eventEmitter } from '../utils/events.js';
import { ConflictError, UnauthorizedError, ValidationError } from '../exceptions/index.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  parseDuration,
} from '../utils/token.js';
import env from '../config/env.js';

const SALT_ROUNDS = 12;
const VERIFICATION_CODE_EXPIRES = 10 * 60 * 1000;
const RESET_TOKEN_EXPIRES = 60 * 60 * 1000;

export class AuthService {
  constructor() {
    this.authRepo = new AuthRepository();
    this.userRepo = new UserRepository();
  }

  async register({ email, password }) {
    const existingUser = await this.authRepo.findUserByEmail(email);
    if (existingUser) {
      throw new ConflictError('Bu e-posta adresi zaten kayıtlı');
    }

    const defaultRole = await this.authRepo.findRoleByName('user');
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await this.authRepo.createUser({
      email,
      password: hashedPassword,
      roleId: defaultRole.id,
    });

    return { id: user.id, email: user.email };
  }

  async verify({ email, code }) {
    const user = await this.authRepo.findUserByEmail(email);
    if (!user) {
      throw new ValidationError('Kullanıcı bulunamadı');
    }

    if (user.is_verified) {
      throw new ValidationError('Hesap zaten doğrulanmış');
    }

    const storedCode = await this.authRepo.findVerificationCode(user.id, code);
    if (!storedCode) {
      throw new ValidationError('Geçersiz veya süresi dolmuş doğrulama kodu');
    }

    await this.authRepo.deleteVerificationCodesByUserId(user.id);
    await this.authRepo.verifyUser(user.id);

    return { id: user.id, email: user.email, isVerified: true };
  }

  async resendVerificationCode(userId) {
    const user = await this.authRepo.findUserById(userId);
    if (!user) {
      throw new ValidationError('Kullanıcı bulunamadı');
    }

    if (user.is_verified) {
      throw new ValidationError('Hesap zaten doğrulanmış');
    }

    await this.authRepo.deleteVerificationCodesByUserId(userId);

    const code = this._generateCode();
    const expiresAt = new Date(Date.now() + VERIFICATION_CODE_EXPIRES);

    await this.authRepo.saveVerificationCode({
      userId: user.id,
      code,
      expiresAt,
    });

    eventEmitter.emit('send-verification-code', { email: user.email, code });

    return { message: 'Doğrulama kodu tekrar gönderildi' };
  }

  async resendVerificationByEmail(email) {
    const user = await this.authRepo.findUserByEmail(email);
    if (!user) {
      throw new ValidationError('Bu e-posta ile kayıtlı hesap bulunamadı');
    }

    if (user.is_verified) {
      throw new ValidationError('Hesap zaten doğrulanmış');
    }

    await this.authRepo.deleteVerificationCodesByUserId(user.id);

    const code = this._generateCode();
    const expiresAt = new Date(Date.now() + VERIFICATION_CODE_EXPIRES);

    await this.authRepo.saveVerificationCode({
      userId: user.id,
      code,
      expiresAt,
    });

    eventEmitter.emit('send-verification-code', { email: user.email, code });

    return { userId: user.id, message: 'Doğrulama kodu tekrar gönderildi' };
  }

  async login({ email, password }) {
    const user = await this.authRepo.findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedError('E-posta veya şifre hatalı');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('E-posta veya şifre hatalı');
    }

    if (!user.is_verified) {
      await this.authRepo.deleteVerificationCodesByUserId(user.id);
      const code = this._generateCode();
      const expiresAt = new Date(Date.now() + VERIFICATION_CODE_EXPIRES);
      await this.authRepo.saveVerificationCode({ userId: user.id, code, expiresAt });
      eventEmitter.emit('send-verification-code', { email: user.email, code });
      throw new UnauthorizedError('Lütfen önce e-postanızı doğrulayın');
    }

    if (!user.is_active) {
      throw new UnauthorizedError('Hesap devre dışı bırakılmış');
    }

    const tokenPayload = { id: user.id, email: user.email, role: user.role };
    const tokens = await this._generateTokens(tokenPayload, user.id);

    return {
      user: { id: user.id, email: user.email, role: user.role },
      tokens,
    };
  }

  async refreshToken(token) {
    if (!token) {
      throw new UnauthorizedError('Yenileme token bulunamadı');
    }

    const storedToken = await this.authRepo.findRefreshToken(token);
    if (!storedToken) {
      throw new UnauthorizedError('Geçersiz yenileme token');
    }

    if (new Date(storedToken.expires_at) < new Date()) {
      await this.authRepo.deleteRefreshToken(token);
      throw new UnauthorizedError('Yenileme token süresi dolmuş');
    }

    if (!storedToken.is_active) {
      await this.authRepo.deleteRefreshTokensByUserId(storedToken.user_id);
      throw new UnauthorizedError('Hesap devre dışı bırakılmış');
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      await this.authRepo.deleteRefreshToken(token);
      throw new UnauthorizedError('Geçersiz yenileme token');
    }

    await this.authRepo.deleteRefreshToken(token);

    const tokenPayload = { id: decoded.id, email: decoded.email, role: storedToken.role };
    const tokens = await this._generateTokens(tokenPayload, storedToken.user_id);

    return { tokens };
  }

  async forgotPassword(email) {
    const user = await this.authRepo.findUserByEmail(email);
    if (!user || !user.is_verified) return;

    await this.authRepo.deletePasswordResetTokensByUserId(user.id);

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRES);

    await this.authRepo.savePasswordResetToken({ userId: user.id, token, expiresAt });
    eventEmitter.emit('send-password-reset', { email: user.email, token });
  }

  async resetPassword(token, newPassword) {
    const resetToken = await this.authRepo.findPasswordResetToken(token);
    if (!resetToken) {
      throw new ValidationError('Geçersiz veya süresi dolmuş sıfırlama bağlantısı');
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.userRepo.updateById(resetToken.user_id, { password: hashedPassword });
    await this.authRepo.markPasswordResetTokenUsed(resetToken.id);
    await this.authRepo.deleteRefreshTokensByUserId(resetToken.user_id);
  }

  async logout(userId, refreshToken) {
    if (refreshToken) {
      await this.authRepo.deleteRefreshToken(refreshToken);
    }
    if (userId) {
      await this.authRepo.deleteRefreshTokensByUserId(userId);
    }
  }

  _generateCode() {
    return crypto.randomInt(100000, 999999).toString();
  }

  async _generateTokens(payload, userId) {
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    const refreshExpiresAt = new Date(Date.now() + parseDuration(env.JWT_REFRESH_EXPIRES_IN));

    await this.authRepo.saveRefreshToken({
      userId,
      token: refreshToken,
      expiresAt: refreshExpiresAt,
    });

    return { accessToken, refreshToken };
  }
}
