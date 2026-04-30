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
        message: 'Kayıt başarılı. Lütfen e-postanızı doğrulayın.',
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
        message: 'E-posta başarıyla doğrulandı. Artık giriş yapabilirsiniz.',
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
        data: { message: 'Oturum yenilendi' },
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
        data: { message: 'Bu e-posta adresi kayıtlıysa sıfırlama bağlantısı gönderildi' },
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
        data: { message: 'Şifre sıfırlandı' },
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
        data: { message: 'Çıkış yapıldı' },
      });
    } catch (err) {
      next(err);
    }
  };
}
