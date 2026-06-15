export const HD_HARDENED_PATH_PART = 0x80000000;

export const toHardenedPathPart = (n: number) => (n | HD_HARDENED_PATH_PART) >>> 0;

export const fromHardenedPathPart = (n: number) => (n & ~HD_HARDENED_PATH_PART) >>> 0;
