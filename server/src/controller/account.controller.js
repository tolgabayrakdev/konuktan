import { AccountService } from '../service/account.service.js';

export class AccountController {
  constructor() {
    this.accountService = new AccountService();
  }

  getProfile = async (req, res, next) => {
    try {
      const user = await this.accountService.getProfile(req.user.id);
      res.status(200).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  };

  updateProfile = async (req, res, next) => {
    try {
      const user = await this.accountService.updateProfile(req.user.id, req.body);
      res.status(200).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  };

  updatePassword = async (req, res, next) => {
    try {
      const result = await this.accountService.updatePassword(req.user.id, req.body);
      res.status(200).json({ success: true, data: { message: 'Password updated' } });
    } catch (err) {
      next(err);
    }
  };

  deleteAccount = async (req, res, next) => {
    try {
      await this.accountService.deleteAccount(req.user.id);
      res.status(200).json({ success: true, data: { message: 'Account deleted' } });
    } catch (err) {
      next(err);
    }
  };
}
