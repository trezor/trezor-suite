export const CSV_NEWLINE = '\n';
export const CSV_SEPARATOR = ',';
const CSV_LEADING_CHARACTERS_TO_ESCAPE_REGEX = /^[\s\uFEFF]*[=+\-@＝＋－＠]/u;

export const sanitizeCsvValue = (value: string): string => {
    const sanitizedValue = CSV_LEADING_CHARACTERS_TO_ESCAPE_REGEX.test(value) ? `'${value}` : value;

    if (
        sanitizedValue.includes(CSV_SEPARATOR) ||
        sanitizedValue.includes('"') ||
        sanitizedValue.includes('\n') ||
        sanitizedValue.includes('\r')
    ) {
        return `"${sanitizedValue.replace(/"/g, '""')}"`;
    }

    return sanitizedValue;
};
