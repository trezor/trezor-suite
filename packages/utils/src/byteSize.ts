export const getByteSizeOfString = (str: string): number => new TextEncoder().encode(str).length;
