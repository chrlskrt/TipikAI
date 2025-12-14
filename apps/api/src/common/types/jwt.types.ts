export interface AccessTokenPayload {
  sub: string;
  email: string;
  username: string;
}

export interface JwtAccessTokenPayload extends AccessTokenPayload {
  iat: number;
  exp: number;
}
