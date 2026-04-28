export class User {
  constructor({ id, email, username, password, roleId, isActive, createdAt, updatedAt }) {
    this.id = id;
    this.email = email;
    this.username = username;
    this.password = password;
    this.roleId = roleId;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      username: this.username,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
