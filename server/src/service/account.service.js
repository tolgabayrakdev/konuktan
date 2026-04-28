import { UserRepository } from '../repository/user.repository.js';
import { NotFoundError, ValidationError } from '../exceptions/index.js';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export class AccountService {
  constructor() {
    this.userRepo = new UserRepository();
  }

  async getProfile(userId) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  async updateProfile(userId, data) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return this.userRepo.updateById(userId, data);
  }

  async updatePassword(userId, { currentPassword, newPassword }) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new ValidationError('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    return this.userRepo.updateById(userId, { password: hashedPassword });
  }

  async deleteAccount(userId) {
    const deleted = await this.userRepo.deleteById(userId);
    if (!deleted) {
      throw new NotFoundError('User not found');
    }
    return deleted;
  }
}
