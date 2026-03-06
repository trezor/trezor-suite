/**
 * @jest-environment jsdom
 */

// Well-known user agent strings for testing. These define the behavioral contract
// that must hold regardless of which UA-parsing library is used under the hood.
const UA_STRINGS = {
    chromeWindows:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    firefoxWindows:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    chromeMac:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    safariMac:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    firefoxLinux:
        'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
    chromeLinux:
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    edgeWindows:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    chromeAndroid:
        'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    safariIOS:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
    chromeOS:
        'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    opera:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0',
};

/**
 * Set `window.navigator.userAgent` and re-import the module so the
 * cached parser is rebuilt from the new string.
 */
const loadModuleWithUA = (ua: string) => {
    Object.defineProperty(window.navigator, 'userAgent', {
        value: ua,
        configurable: true,
    });

    // Module caches the parser; a fresh import is required for each UA.
    jest.resetModules();

    return import('../userAgent');
};

/**
 * Helper to mock navigator.userAgentData with a Client Hints implementation.
 */
const mockUserAgentData = (data: { platformVersion?: string; architecture?: string }) => {
    Object.defineProperty(window.navigator, 'userAgentData', {
        value: {
            getHighEntropyValues: () => Promise.resolve(data),
        },
        configurable: true,
    });
};

const clearUserAgentData = () => {
    Object.defineProperty(window.navigator, 'userAgentData', {
        value: undefined,
        configurable: true,
    });
};

describe('userAgent utilities', () => {
    afterEach(() => {
        jest.restoreAllMocks();
        clearUserAgentData();
    });

    // -------------------------------------------------------------------
    // getUserAgent
    // -------------------------------------------------------------------
    describe('getUserAgent', () => {
        it('returns the current navigator.userAgent string', async () => {
            const { getUserAgent } = await loadModuleWithUA(UA_STRINGS.chromeWindows);
            expect(getUserAgent()).toBe(UA_STRINGS.chromeWindows);
        });

        it('reflects a changed userAgent', async () => {
            const { getUserAgent } = await loadModuleWithUA(UA_STRINGS.firefoxLinux);
            expect(getUserAgent()).toBe(UA_STRINGS.firefoxLinux);
        });
    });

    // -------------------------------------------------------------------
    // getBrowserName
    // -------------------------------------------------------------------
    describe('getBrowserName', () => {
        it.each([
            { ua: UA_STRINGS.chromeWindows, expected: 'chrome' },
            { ua: UA_STRINGS.chromeMac, expected: 'chrome' },
            { ua: UA_STRINGS.chromeLinux, expected: 'chrome' },
            { ua: UA_STRINGS.chromeAndroid, expected: 'chrome' },
            { ua: UA_STRINGS.firefoxWindows, expected: 'firefox' },
            { ua: UA_STRINGS.firefoxLinux, expected: 'firefox' },
            { ua: UA_STRINGS.safariMac, expected: 'safari' },
            { ua: UA_STRINGS.safariIOS, expected: 'safari' },
            { ua: UA_STRINGS.edgeWindows, expected: 'edge' },
            { ua: UA_STRINGS.opera, expected: 'opera' },
        ])('returns "$expected" for $ua', async ({ ua, expected }) => {
            const { getBrowserName } = await loadModuleWithUA(ua);
            expect(getBrowserName()).toBe(expected);
        });

        it('returns lowercase name without spaces', async () => {
            const { getBrowserName } = await loadModuleWithUA(UA_STRINGS.edgeWindows);
            const name = getBrowserName();
            expect(name).toBe(name.toLowerCase());
            expect(name).not.toContain(' ');
        });

        it('returns empty string for unrecognized user agent', async () => {
            const { getBrowserName } = await loadModuleWithUA('UnknownBot/1.0');
            expect(getBrowserName()).toBe('');
        });
    });

    // -------------------------------------------------------------------
    // getBrowserVersion
    // -------------------------------------------------------------------
    describe('getBrowserVersion', () => {
        it('returns a non-empty version string for Chrome', async () => {
            const { getBrowserVersion } = await loadModuleWithUA(UA_STRINGS.chromeWindows);
            expect(getBrowserVersion()).toBe('120.0.0.0');
        });

        it('returns a non-empty version string for Firefox', async () => {
            const { getBrowserVersion } = await loadModuleWithUA(UA_STRINGS.firefoxLinux);
            expect(getBrowserVersion()).toBe('121.0');
        });

        it('returns a non-empty version string for Safari', async () => {
            const { getBrowserVersion } = await loadModuleWithUA(UA_STRINGS.safariMac);
            expect(getBrowserVersion()).toBe('17.2');
        });

        it('returns a non-empty version string for Edge', async () => {
            const { getBrowserVersion } = await loadModuleWithUA(UA_STRINGS.edgeWindows);
            expect(getBrowserVersion()).toBe('120.0.0.0');
        });

        it('returns empty string for unrecognized user agent', async () => {
            const { getBrowserVersion } = await loadModuleWithUA('UnknownBot/1.0');
            expect(getBrowserVersion()).toBe('');
        });
    });

    // -------------------------------------------------------------------
    // getOsNameWeb
    // -------------------------------------------------------------------
    describe('getOsNameWeb', () => {
        it.each([
            { ua: UA_STRINGS.chromeWindows, expected: 'Windows' },
            { ua: UA_STRINGS.firefoxWindows, expected: 'Windows' },
            { ua: UA_STRINGS.firefoxLinux, expected: 'Linux' },
            { ua: UA_STRINGS.chromeLinux, expected: 'Linux' },
            { ua: UA_STRINGS.chromeAndroid, expected: 'Android' },
            { ua: UA_STRINGS.safariIOS, expected: 'iOS' },
            { ua: UA_STRINGS.chromeOS, expected: 'ChromeOS' },
        ])('returns "$expected" for $ua', async ({ ua, expected }) => {
            const { getOsNameWeb } = await loadModuleWithUA(ua);
            expect(getOsNameWeb()).toBe(expected);
        });

        it('returns macOS name without spaces for Mac user agents', async () => {
            const { getOsNameWeb } = await loadModuleWithUA(UA_STRINGS.chromeMac);
            const name = getOsNameWeb();
            expect(name).not.toContain(' ');
            // Should be some case-insensitive variant of "macos"
            expect(name!.toLowerCase()).toBe('macos');
        });

        it('does not contain spaces', async () => {
            for (const ua of Object.values(UA_STRINGS)) {
                const { getOsNameWeb } = await loadModuleWithUA(ua);
                const name = getOsNameWeb();
                if (name) {
                    expect(name).not.toContain(' ');
                }
            }
        });
    });

    // -------------------------------------------------------------------
    // getOsFamily
    // -------------------------------------------------------------------
    describe('getOsFamily', () => {
        it.each([
            { ua: UA_STRINGS.chromeWindows, expected: 'Windows' },
            { ua: UA_STRINGS.firefoxWindows, expected: 'Windows' },
            { ua: UA_STRINGS.edgeWindows, expected: 'Windows' },
            { ua: UA_STRINGS.opera, expected: 'Windows' },
        ])('returns "Windows" for Windows UA ($ua)', async ({ ua, expected }) => {
            const { getOsFamily } = await loadModuleWithUA(ua);
            expect(getOsFamily()).toBe(expected);
        });

        it.each([
            { ua: UA_STRINGS.chromeMac, expected: 'MacOS' },
            { ua: UA_STRINGS.safariMac, expected: 'MacOS' },
        ])('returns "MacOS" for macOS UA ($ua)', async ({ ua, expected }) => {
            const { getOsFamily } = await loadModuleWithUA(ua);
            expect(getOsFamily()).toBe(expected);
        });

        it.each([
            { ua: UA_STRINGS.chromeLinux, expected: 'Linux' },
            { ua: UA_STRINGS.firefoxLinux, expected: 'Linux' },
            { ua: UA_STRINGS.chromeAndroid, expected: 'Linux' },
            { ua: UA_STRINGS.safariIOS, expected: 'Linux' },
            { ua: UA_STRINGS.chromeOS, expected: 'Linux' },
        ])('returns "Linux" as fallback for non-Windows/macOS ($ua)', async ({ ua, expected }) => {
            const { getOsFamily } = await loadModuleWithUA(ua);
            expect(getOsFamily()).toBe(expected);
        });

        it('only returns one of the three known families', async () => {
            const validFamilies = ['Windows', 'MacOS', 'Linux'];
            for (const ua of Object.values(UA_STRINGS)) {
                const { getOsFamily } = await loadModuleWithUA(ua);
                expect(validFamilies).toContain(getOsFamily());
            }
        });
    });

    // -------------------------------------------------------------------
    // getDeviceType
    // -------------------------------------------------------------------
    describe('getDeviceType', () => {
        it('returns "mobile" for a mobile user agent', async () => {
            const { getDeviceType } = await loadModuleWithUA(UA_STRINGS.chromeAndroid);
            expect(getDeviceType()).toBe('mobile');
        });

        it('returns "mobile" for an iOS user agent', async () => {
            const { getDeviceType } = await loadModuleWithUA(UA_STRINGS.safariIOS);
            expect(getDeviceType()).toBe('mobile');
        });

        it('returns "desktop" for a desktop user agent', async () => {
            const { getDeviceType } = await loadModuleWithUA(UA_STRINGS.chromeWindows);
            expect(getDeviceType()).toBe('desktop');
        });
    });

    // -------------------------------------------------------------------
    // getOsVersion (async – uses Client Hints API when available,
    // falls back to Bowser's parsed version)
    // -------------------------------------------------------------------
    describe('getOsVersion', () => {
        it('returns the OS version from Bowser when Client Hints are unavailable', async () => {
            const { getOsVersion } = await loadModuleWithUA(UA_STRINGS.chromeWindows);
            const version = await getOsVersion();
            expect(typeof version).toBe('string');
            expect(version).toBe('NT 10.0');
        });

        it('returns a version for macOS from Bowser fallback', async () => {
            const { getOsVersion } = await loadModuleWithUA(UA_STRINGS.chromeMac);
            const version = await getOsVersion();
            expect(typeof version).toBe('string');
            expect(version).toBe('10.15.7');
        });

        it('returns empty string when version is not available', async () => {
            const { getOsVersion } = await loadModuleWithUA('UnknownBot/1.0');
            const version = await getOsVersion();
            expect(version).toBe('');
        });

        it('prefers Client Hints data when available', async () => {
            const { getOsVersion } = await loadModuleWithUA(UA_STRINGS.chromeWindows);
            mockUserAgentData({ platformVersion: '15.0.0' });
            const version = await getOsVersion();
            expect(version).toBe('15.0.0');
        });
    });

    // -------------------------------------------------------------------
    // getCpuArch (async – uses Client Hints API, returns empty string
    // when unavailable since CPU arch is not derivable from UA string)
    // -------------------------------------------------------------------
    describe('getCpuArch', () => {
        it('returns empty string when Client Hints are unavailable', async () => {
            const { getCpuArch } = await loadModuleWithUA(UA_STRINGS.chromeWindows);
            const arch = await getCpuArch();
            expect(arch).toBe('');
        });

        it('returns architecture from Client Hints when available', async () => {
            const { getCpuArch } = await loadModuleWithUA(UA_STRINGS.chromeWindows);
            mockUserAgentData({ architecture: 'x86' });
            const arch = await getCpuArch();
            expect(arch).toBe('x86');
        });

        it('returns empty string when Client Hints have no architecture', async () => {
            const { getCpuArch } = await loadModuleWithUA(UA_STRINGS.chromeMac);
            mockUserAgentData({});
            const arch = await getCpuArch();
            expect(arch).toBe('');
        });
    });
});
