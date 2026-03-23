import jwt from "jsonwebtoken";

class JWTService {
  async generalAccessToken(payload) {
    const access_token = jwt.sign(
      {
        payload,
      },
      process.env.ACCESS_TOKEN,
      { expiresIn: "1h" },
    );
    return access_token;
  }
  async verifyRefreshToken(token) {
    return jwt.verify(token, process.env.REFRESH_TOKEN);
  }
  async generalRefreshToken(payload) {
    const refresh_token = jwt.sign(
      {
        payload,
      },
      process.env.REFRESH_TOKEN,
      { expiresIn: "7d" },
    );
    return refresh_token;
  }
}
export default new JWTService();
