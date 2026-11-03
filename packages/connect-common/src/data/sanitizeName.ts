export const MAX_NAME_LENGTH = 100;

export type SanitizeNameOptions = {
    maxLength?: number;
};

export const sanitizeName = (
    name: string,
    { maxLength }: SanitizeNameOptions = {},
): string | undefined => {
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
