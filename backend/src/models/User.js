class User {
  constructor(id, deviceInfo, language = 'ja') {
    this.id = id;
    this.deviceInfo = deviceInfo;
    this.language = language;
    this.createdAt = new Date();
    this.lastActive = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      deviceInfo: this.deviceInfo,
      language: this.language,
      createdAt: this.createdAt.toISOString(),
      lastActive: this.lastActive.toISOString()
    };
  }
}

module.exports = User;
