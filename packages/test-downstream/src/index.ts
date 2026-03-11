import { a } from '@trezor/test';
export const b = 1;
export const fn = (arg: number): number => arg;
fn(a);
// harmless change to trigger type-check here
