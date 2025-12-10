/**
 * Normalizes a label by trimming whitespace and converting empty strings to null.
 */
export const normalizeLabel = (label: string | null | undefined): string | null => {
    if (label === null || label === undefined) {
        return null;
    }

    const trimmed = label.trim();

    return trimmed.length === 0 ? null : trimmed;
};
