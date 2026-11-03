export const MAX_NAME_LENGTH = 100;

export type SanitizeNameOptions = {
    maxLength?: number;
    /** What to do with a name longer than `maxLength`: drop it, or cut it to the limit. */
    onTooLong?: 'reject' | 'truncate';
};

/**
 * The single rule for every name a caller picks for itself and Suite then shows on the Connect
 * consent prompt — a web/webextension or desktop-ws `manifest.appName`, a deeplink `appName`, a
 * WalletConnect peer name, an MCP client name, an OS-reported process name — and for the
 * `hostName`/`appName` sent to the device over THP.
 *
 * Anything but a string is dropped instead of reaching the renderer. Control characters, lone
 * surrogates and invisible format characters (bidi overrides, joiners, soft hyphen, zero-width
 * space) are all reduced to spaces: the name stays the single line of text the prompt expects,
 * nothing invisible can reorder the text around it or make the whole name render as nothing, and
 * no such character can be removed to splice two parts of the name into another app's name — a
 * name left with nothing but spaces is dropped. Length is counted and cut in code points, so a cut
 * never leaves half of a surrogate pair.
 */
export const sanitizeName = (
    name: unknown,
    { maxLength, onTooLong = 'reject' }: SanitizeNameOptions = {},
): string | undefined => {
    if (typeof name !== 'string') return undefined;

    const sanitized = name
        .replace(/[\p{Cc}\p{Cs}\p{Cf}]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (sanitized.length === 0) {
        return undefined;
    }

    if (maxLength === undefined) {
        return sanitized;
    }

    const codePoints = Array.from(sanitized);
    if (codePoints.length <= maxLength) {
        return sanitized;
    }

    if (onTooLong === 'reject') {
        return undefined;
    }

    // The cut can land on a space, which would be shown as a trailing one.
    const truncated = codePoints.slice(0, maxLength).join('').trim();

    return truncated.length === 0 ? undefined : truncated;
};
