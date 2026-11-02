/**
 * How much a page posted, in UTF-16 code units: the length of the string the bridge carries, or of
 * the JSON a value posted on iOS through the WebKit handler serializes to. A value JSON cannot
 * serialize cannot have crossed the bridge either, so it counts as nothing.
 */
export const getMessageDataLength = (data: unknown): number => {
    if (typeof data === 'string') {
        return data.length;
    }

    try {
        return JSON.stringify(data)?.length ?? 0;
    } catch {
        return 0;
    }
};
