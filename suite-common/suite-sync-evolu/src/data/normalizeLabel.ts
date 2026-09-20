// No-label is represented as NULL. Labels are stored trimmed; trimming here also keeps
// previously stored untrimmed labels valid for the trimmed Evolu string types.
export const normalizeLabel = (label: string | null) => {
    const trimmedLabel = label?.trim();

    return trimmedLabel ? trimmedLabel : null;
};
