/**
 * Normalizes a string for search by removing diacritics, converting to lowercase, and trimming whitespace.
 * Used by list filter callbacks (e.g. country and subdivision search).
 */
export const normalizeForSearch = (str: string): string =>
    str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
