export const MAX_NAME_LENGTH = 100;

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_REGEX = /[\x00-\x1F\x7F]/g;

export const sanitizeName = (name: string, maxLength?: number): string | undefined => {
    const sanitized = name.replace(CONTROL_CHARS_REGEX, '').replace(/\s+/g, ' ').trim();

    if (sanitized.length === 0) {
        return undefined;
    }

    if (maxLength !== undefined && sanitized.length > maxLength) {
        return undefined;
    }

    return sanitized;
};
