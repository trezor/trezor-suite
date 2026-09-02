export enum Color {
    Red = 1,
    Green = 2,
    Blue = 3,
}

export interface User {
    id: number;
    name: string;
    favoriteColor: Color;
    tags?: string[];
}

export type UserList = User[];
