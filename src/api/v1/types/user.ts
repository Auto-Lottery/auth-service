export type LoginData = {
  phoneNumber: string;
  password: string;
};

export type User = {
  phoneNumber: string;
  operator: string;
  _id: string;
  createdDate?: number;
};

export type UserWithToken = {
  accessToken: string;
} & User;

export type AdminUser = {
  phoneNumber: string;
  operator: string;
  _id: string;
  roles: string[];
  status: string;
};

export type AdminUserWithToken = {
  token: string;
  exp?: number;
} & AdminUser;
