export type EnvironmentIssue = 'unsupported-os' | 'unsupported-browser';

export type EnvironmentInfo = {
    userAgent: string;
    /** `navigator.maxTouchPoints`; tells an iPad apart from a Mac, which share a user agent. */
    maxTouchPoints: number;
};

const CHROMIUM_OR_FIREFOX = /(Chrome|Chromium|CriOS|Edg|OPR|Firefox|FxiOS)\//;

/**
 * The bridge with HID support exists in Trezor Suite for Windows and macOS only, and Safari
 * cannot call a plain-HTTP localhost server from an HTTPS page. Everything else is refused
 * before the user spends time on steps that cannot work.
 */
export const getEnvironmentIssue = ({
    userAgent,
    maxTouchPoints,
}: EnvironmentInfo): EnvironmentIssue | undefined => {
    const isWindows = /Windows NT/.test(userAgent);
    const isMac = /Macintosh|Mac OS X/.test(userAgent) && !/iPhone|iPad|iPod/.test(userAgent);
    const isTouchMac = isMac && maxTouchPoints > 1;

    if ((!isWindows && !isMac) || isTouchMac) return 'unsupported-os';

    // Every browser on macOS names Safari in its user agent. Only the real one names nothing else.
    const isSafari = /Safari\//.test(userAgent) && !CHROMIUM_OR_FIREFOX.test(userAgent);
    if (isSafari) return 'unsupported-browser';

    return undefined;
};
