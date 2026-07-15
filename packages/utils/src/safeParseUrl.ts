/**
 * Parses a string into a `URL`, returning `null` instead of throwing on invalid input.
 */
export const safeParseUrl = (uri: string): URL | null => {
    try {
        return new URL(uri);
    } catch {
        return null;
    }
};
