import Bowser from 'bowser';

/** Minimal typing for the experimental Navigator.userAgentData Client Hints API. */
interface UAData {
    getHighEntropyValues(
        hints: string[],
    ): Promise<{ platformVersion?: string; architecture?: string }>;
}

let bowserParser: Bowser.Parser.Parser;

export const getUserAgent = () => window.navigator.userAgent;

const getBowserParser = () => {
    if (!bowserParser) {
        bowserParser = Bowser.getParser(getUserAgent());
    }

    return bowserParser;
};

/**
 * Uses the Client Hints API (Chromium-based browsers) for accurate OS version detection,
 * since the basic user-agent string cannot distinguish macOS >= 11 or Windows 10 vs 11.
 * Falls back to Bowser's parsed version on non-Chromium browsers.
 */
export const getOsVersion = async () => {
    if ('userAgentData' in navigator && navigator.userAgentData) {
        try {
            const values = await (navigator.userAgentData as UAData).getHighEntropyValues(
                ['platformVersion'],
            );
            if (values.platformVersion) {
                return values.platformVersion;
            }
        } catch {
            // Fall through to Bowser
        }
    }

    return getBowserParser().getOSVersion() ?? '';
};

/**
 * Uses the Client Hints API for CPU architecture detection (Chromium-based browsers).
 * Returns an empty string on browsers that don't support Client Hints.
 */
export const getCpuArch = async () => {
    if ('userAgentData' in navigator && navigator.userAgentData) {
        try {
            const values = await (navigator.userAgentData as UAData).getHighEntropyValues(
                ['architecture'],
            );
            if (values.architecture) {
                return values.architecture;
            }
        } catch {
            // Fall through
        }
    }

    return '';
};

/**
 * Mapping to normalize Bowser browser names to legacy identifiers.
 * For example, Bowser reports "Microsoft Edge" while the codebase expects "edge".
 */
const browserNameOverrides: Record<string, string> = {
    microsoftedge: 'edge',
};

const isBrave = () =>
    typeof navigator !== 'undefined' &&
    'brave' in navigator &&
    typeof (navigator as Navigator & { brave?: { isBrave?: unknown } }).brave?.isBrave ===
    'function';

export const getBrowserName = () => {
    if (isBrave()) {
        return 'brave';
    }

    const normalized = getBowserParser().getBrowserName().replace(/\s+/g, '').toLowerCase();

    return browserNameOverrides[normalized] ?? normalized;
};

export const getBrowserVersion = () => getBowserParser().getBrowserVersion() || '';

// Generally works the same as `getOsName`, just with a different information source,
// but does not work in some specific iOS cases.
export const getOsNameWeb = () => getBowserParser().getOSName().replaceAll(' ', '') || undefined;

export const getOsFamily = () => {
    const osName = getBowserParser().getOSName().toLowerCase().replaceAll(' ', '');

    if (osName === 'windows') {
        return 'Windows';
    }
    if (osName === 'macos') {
        return 'MacOS';
    }

    return 'Linux';
};

export const getDeviceType = () => getBowserParser().getPlatformType() || undefined;
