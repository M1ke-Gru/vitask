export type SignupRequest = {
  username: string;
  email: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
  token_type: "bearer" | string;
  user_id: number;
};
