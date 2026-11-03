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

    if (maxLength !== undefined && sanitized.length > maxLength) {
        return undefined;
    }

    return sanitized;
};
