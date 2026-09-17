export const STELLAR_MEMO_TEXT_MAX_BYTES = 28;

/** Trims text to what fits a Stellar text memo, whole characters only. */
export const fitStellarMemoText = (text: string) => {
    const characters = Array.from(text.trim());

    while (Buffer.byteLength(characters.join(''), 'utf8') > STELLAR_MEMO_TEXT_MAX_BYTES) {
        characters.pop();
    }

    return characters.join('').trimEnd();
};
