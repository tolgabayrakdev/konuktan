import { AuthService } from '../service/auth.service.js';
import { getAccessTokenCookieOptions, getRefreshTokenCookieOptions } from '../utils/token.js';

export class AuthController {
  constructor() {
    this.authService = new AuthService();
  }

  register = async (req, res, next) => {
    try {
      const result = await this.authService.register(req.body);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Registration successful. Please verify your email.',
      });
    } catch (err) {
      next(err);
    }
  };

  verify = async (req, res, next) => {
    try {
      const { email, code } = req.body;
      const result = await this.authService.verify({ email, code });

      res.status(200).json({
        success: true,
        data: result,
        message: 'Email verified successfully. You can now login.',
      });
    } catch (err) {
      next(err);
    }
  };

  resendVerificationCode = async (req, res, next) => {
    try {
      const { userId, email } = req.body;
      const result = userId
        ? await this.authService.resendVerificationCode(userId)
        : await this.authService.resendVerificationByEmail(email);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  login = async (req, res, next) => {
    try {
      const result = await this.authService.login(req.body);

      res.cookie('accessToken', result.tokens.accessToken, getAccessTokenCookieOptions());
      res.cookie('refreshToken', result.tokens.refreshToken, getRefreshTokenCookieOptions());

      res.status(200).json({
        success: true,
        data: result.user,
      });
    } catch (err) {
      next(err);
    }
  };

  refreshToken = async (req, res, next) => {
    try {
      const token = req.cookies?.refreshToken;
      const result = await this.authService.refreshToken(token);

      res.cookie('accessToken', result.tokens.accessToken, getAccessTokenCookieOptions());
      res.cookie('refreshToken', result.tokens.refreshToken, getRefreshTokenCookieOptions());

      res.status(200).json({
        success: true,
        data: { message: 'Tokens refreshed' },
      });
    } catch (err) {
      res.clearCookie('accessToken', getAccessTokenCookieOptions());
      res.clearCookie('refreshToken', getRefreshTokenCookieOptions());
      next(err);
    }
  };

  forgotPassword = async (req, res, next) => {
    try {
      await this.authService.forgotPassword(req.body.email);
      res.status(200).json({
        success: true,
        data: { message: 'If this email exists, a reset link has been sent' },
      });
    } catch (err) {
      next(err);
    }
  };

  resetPassword = async (req, res, next) => {
    try {
      const { token, newPassword } = req.body;
      await this.authService.resetPassword(token, newPassword);
      res.status(200).json({
        success: true,
        data: { message: 'Password reset successful' },
      });
    } catch (err) {
      next(err);
    }
  };

  logout = async (req, res, next) => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      await this.authService.logout(req.user?.id, refreshToken);

      res.clearCookie('accessToken', getAccessTokenCookieOptions());
      res.clearCookie('refreshToken', getRefreshTokenCookieOptions());

      res.status(200).json({
        success: true,
        data: { message: 'Logged out successfully' },
      });
    } catch (err) {
      next(err);
    }
  };
}
