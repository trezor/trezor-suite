export const MAX_NAME_LENGTH = 100;

export type SanitizeNameOptions = {
    maxLength?: number;
};

export const sanitizeName = (
    name: unknown,
    { maxLength }: SanitizeNameOptions = {},
): string | undefined => {
    if (typeof name !== 'string') return undefined;

    const sanitized = name
        .replace(/[\p{Cc}\p{Cs}\p{Cf}]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (sanitized.length === 0) {
        return undefined;
    }

    // Counted in code points, so a name is not rejected for an astral character taking two
    // UTF-16 units.
    if (maxLength !== undefined && Array.from(sanitized).length > maxLength) {
        return undefined;
    }

    return sanitized;
};
