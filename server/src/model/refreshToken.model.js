export class RefreshToken {
  constructor({ id, userId, token, expiresAt, createdAt }) {
    this.id = id;
    this.userId = userId;
    this.token = token;
    this.expiresAt = expiresAt;
    this.createdAt = createdAt;
  }
}
