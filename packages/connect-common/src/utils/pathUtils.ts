/* eslint-disable no-bitwise */

export const HD_HARDENED = 0x80000000;
export const toHardened = (n: number) => (n | HD_HARDENED) >>> 0;
export const fromHardened = (n: number) => (n & ~HD_HARDENED) >>> 0;
