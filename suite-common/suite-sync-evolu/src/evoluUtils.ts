import { type Query } from '@evolu/common';

export type UnwrapQuery<T> = T extends Query<infer U> ? U : T;
