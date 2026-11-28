import { getEnvironmentIssue } from './environment';

const USER_AGENTS = {
    chromeWindows:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
    edgeWindows:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
    firefoxWindows:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:143.0) Gecko/20100101 Firefox/143.0',
    chromeMac:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
    firefoxMac:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:143.0) Gecko/20100101 Firefox/143.0',
    safariMac:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
    chromeLinux:
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
    firefoxLinux: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:143.0) Gecko/20100101 Firefox/143.0',
    chromeAndroid:
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
    chromeOS:
        'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
    safariIPhone:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
};

describe('getEnvironmentIssue', () => {
    it.each(['chromeWindows', 'edgeWindows', 'firefoxWindows', 'chromeMac', 'firefoxMac'] as const)(
        'accepts %s',
        browser => {
            expect(
                getEnvironmentIssue({ userAgent: USER_AGENTS[browser], maxTouchPoints: 0 }),
            ).toBeUndefined();
        },
    );

    it.each(['chromeLinux', 'firefoxLinux', 'chromeAndroid', 'chromeOS', 'safariIPhone'] as const)(
        'refuses the operating system of %s',
        browser => {
            expect(
                getEnvironmentIssue({ userAgent: USER_AGENTS[browser], maxTouchPoints: 0 }),
            ).toBe('unsupported-os');
        },
    );

    it('refuses Safari on macOS', () => {
        expect(getEnvironmentIssue({ userAgent: USER_AGENTS.safariMac, maxTouchPoints: 0 })).toBe(
            'unsupported-browser',
        );
    });

    it('refuses an iPad that presents itself as a Mac', () => {
        expect(getEnvironmentIssue({ userAgent: USER_AGENTS.safariMac, maxTouchPoints: 5 })).toBe(
            'unsupported-os',
        );
    });

    it('accepts a Windows computer with a touch screen', () => {
        expect(
            getEnvironmentIssue({ userAgent: USER_AGENTS.chromeWindows, maxTouchPoints: 10 }),
        ).toBeUndefined();
    });
});
