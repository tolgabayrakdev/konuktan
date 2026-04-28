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

  async register({ email, username, password }) {
    const existingUser = await this.authRepo.findUserByEmail(email);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const existingUsername = await this.authRepo.findUserByUsername(username);
    if (existingUsername) {
      throw new ConflictError('Username already taken');
    }

    const defaultRole = await this.authRepo.findRoleByName('user');
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await this.authRepo.createUser({
      email,
      username,
      password: hashedPassword,
      roleId: defaultRole.id,
    });

    return { id: user.id, email: user.email, username: user.username };
  }

  async verify({ email, code }) {
    const user = await this.authRepo.findUserByEmail(email);
    if (!user) {
      throw new ValidationError('User not found');
    }

    if (user.is_verified) {
      throw new ValidationError('Account already verified');
    }

    const storedCode = await this.authRepo.findVerificationCode(user.id, code);
    if (!storedCode) {
      throw new ValidationError('Invalid or expired verification code');
    }

    await this.authRepo.deleteVerificationCodesByUserId(user.id);
    await this.authRepo.verifyUser(user.id);

    return { id: user.id, email: user.email, username: user.username, isVerified: true };
  }

  async resendVerificationCode(userId) {
    const user = await this.authRepo.findUserById(userId);
    if (!user) {
      throw new ValidationError('User not found');
    }

    if (user.is_verified) {
      throw new ValidationError('Account already verified');
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

    return { message: 'Verification code resent' };
  }

  async resendVerificationByEmail(email) {
    const user = await this.authRepo.findUserByEmail(email);
    if (!user) {
      throw new ValidationError('No account found with this email');
    }

    if (user.is_verified) {
      throw new ValidationError('Account already verified');
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

    return { userId: user.id, message: 'Verification code resent' };
  }

  async login({ email, password }) {
    const user = await this.authRepo.findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.is_verified) {
      await this.authRepo.deleteVerificationCodesByUserId(user.id);
      const code = this._generateCode();
      const expiresAt = new Date(Date.now() + VERIFICATION_CODE_EXPIRES);
      await this.authRepo.saveVerificationCode({ userId: user.id, code, expiresAt });
      eventEmitter.emit('send-verification-code', { email: user.email, code });
      throw new UnauthorizedError('Please verify your email first');
    }

    if (!user.is_active) {
      throw new UnauthorizedError('Account is deactivated');
    }

    const tokenPayload = { id: user.id, email: user.email, role: user.role };
    const tokens = await this._generateTokens(tokenPayload, user.id);

    return {
      user: { id: user.id, email: user.email, username: user.username, role: user.role },
      tokens,
    };
  }

  async refreshToken(token) {
    if (!token) {
      throw new UnauthorizedError('Refresh token missing');
    }

    const storedToken = await this.authRepo.findRefreshToken(token);
    if (!storedToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (new Date(storedToken.expires_at) < new Date()) {
      await this.authRepo.deleteRefreshToken(token);
      throw new UnauthorizedError('Refresh token expired');
    }

    if (!storedToken.is_active) {
      await this.authRepo.deleteRefreshTokensByUserId(storedToken.user_id);
      throw new UnauthorizedError('Account is deactivated');
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      await this.authRepo.deleteRefreshToken(token);
      throw new UnauthorizedError('Invalid refresh token');
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
      throw new ValidationError('Invalid or expired reset link');
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
