/**
 * A contact label is written to WARD as the UTF-8 bytes of the entry value. ward-draft firmware does
 * not show it, but a later signing-time bind would, so it is capped by byte length to fit one line
 * of the device screen. Multibyte names (emoji, accented text) reach the cap sooner than their
 * character count suggests. The write-time validation and the inline UI hints share this cap, so a
 * name that the write would reject is already rejected at the input.
 */
export const MAX_LABEL_BYTES = 32;

/** UTF-8 byte length of a label, the unit of the cap. */
export const labelByteLength = (label: string): number => new TextEncoder().encode(label).length;

/** Whether a label, once trimmed, is non-empty and within the byte cap. */
export const isLabelWithinLimit = (label: string): boolean => {
    const bytes = labelByteLength(label.trim());

    return bytes > 0 && bytes <= MAX_LABEL_BYTES;
};
