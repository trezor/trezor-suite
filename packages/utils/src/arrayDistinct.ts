/**
 * Helper function to filter only distinct elements of an array
 */
export const arrayDistinct = <T>(item: T, index: number, self: T[]) => self.indexOf(item) === index;
