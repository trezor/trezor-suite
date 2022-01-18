export const getNumberFromPxString = (size: string): number => parseInt(size.replace('px', ''), 10);
