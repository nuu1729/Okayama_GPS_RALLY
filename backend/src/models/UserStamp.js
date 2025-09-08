class UserStamp {
  constructor(userId, stampId, location = null) {
    this.userId = userId;
    this.stampId = stampId;
    this.location = location;
    this.collectedAt = new Date();
  }

  toJSON() {
    return {
      userId: this.userId,
      stampId: this.stampId,
      location: this.location,
      collectedAt: this.collectedAt.toISOString()
    };
  }
}

module.exports = UserStamp;