export type UserType = 'regular' | 'pro';

export interface UserInterface {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  email: string;
  password: string;
  avatarUrl: string;
  type: UserType;
  favorites: string[];
}

export type PublicUser = Omit<UserInterface, 'password'>;

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  avatarUrl?: string;
}

export interface UpdateUser {
  avatarUrl?: string;
  name?: string;
  favorites?: string[];
}
