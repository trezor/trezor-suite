import { getOS, getBrowserState, getSuggestedPlatform } from '../browserUtils';
import { config } from '../../data/config';

// user agents taken from bowser tests:
// https://github.com/lancedikson/bowser/blob/f09411489ced05811c91cc6670a8e4ca9cbe39a7/test/acceptance/useragentstrings.yml

const FIXTURES = [
    {
        description: 'No userAgent',
        userAgent: null,
        os: 'unknown',
        browserState: {
            mobile: false,
            name: 'unknown',
            osname: 'unknown',
            outdated: false,
            supported: false,
        },
    },
    {
        description: 'unknown userAgent without name',
        userAgent: 'Mozilla/5.0',
        os: 'unknown',
        browserState: {
            mobile: false,
            name: ': ; undefined: undefined;',
            osname: undefined,
            outdated: false,
            supported: false,
        },
    },
    {
        description: 'Firefox linux outdated',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:15.0) Gecko/20120724 Debian Iceweasel/15.0',
        os: 'linux',
        platform: 'deb64',
        browserState: {
            mobile: false,
            name: 'Firefox: 15.0; Linux: undefined;',
            osname: 'Linux',
            outdated: true,
            supported: false,
        },
    },
    {
        description: 'Firefox linux',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:15.0) Gecko/20100101 Firefox/89.0',
        os: 'linux',
        platform: 'deb64',
        browserState: {
            mobile: false,
            name: 'Firefox: 89.0; Linux: undefined;',
            osname: 'Linux',
            outdated: false,
            supported: true,
        },
    },
    {
        description: 'Chrome linux',
        userAgent:
            'Mozilla/5.0 (X11; Linux x86_64; rv:15.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
        os: 'linux',
        platform: 'deb64',
        browserState: {
            mobile: false,
            name: 'Chrome: 91.0.4472.114; Linux: undefined;',
            osname: 'Linux',
            outdated: false,
            supported: true,
        },
    },
    {
        description: 'Chrome linux 32',
        userAgent:
            'Mozilla/5.0 (X11; Linux i686; rv:15.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
        os: 'linux',
        platform: 'deb32',
        browserState: {
            mobile: false,
            name: 'Chrome: 91.0.4472.114; Linux: undefined;',
            osname: 'Linux',
            outdated: false,
            supported: true,
        },
    },
    {
        description: 'Chrome linux 32, rpm',
        userAgent:
            'Mozilla/5.0 (X11; Fedora; Fedora; Linux i686; rv:15.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
        os: 'linux',
        platform: 'rpm32',
        browserState: {
            mobile: false,
            name: 'Chrome: 91.0.4472.114; Linux: undefined;',
            osname: 'Linux',
            outdated: false,
            supported: true,
        },
    },
    {
        description: 'Safari macos',
        userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/537.13+ (KHTML, like Gecko) Version/5.1.7 Safari/534.57.2',
        os: 'macos',
        platform: 'mac',
        browserState: {
            mobile: false,
            name: 'Safari: 5.1.7; macOS: 10.6.8;',
            osname: 'macOS',
            outdated: false,
            supported: false,
        },
    },
    {
        description: 'Chrome android (supported with webusb)',
        userAgent:
            'Mozilla/5.0 (Linux; Android 7.0; HUAWEI CAN-L01) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
        os: 'android',
        browserState: {
            mobile: true,
            name: 'Chrome: 91.0.4472.114; Android: 7.0;',
            osname: 'Android',
            outdated: false,
            supported: true,
        },
        usb: true,
    },
    {
        description: 'Firefox android (not supported, without webusb)',
        userAgent: 'Mozilla/5.0 (Linux; Android 7.0; HUAWEI CAN-L01) Gecko/20100101 Firefox/89.0',
        os: 'android',
        browserState: {
            mobile: true,
            name: 'Firefox: 89.0; Android: 7.0;',
            osname: 'Android',
            outdated: false,
            supported: false,
        },
    },
    {
        description: 'Edge windows',
        userAgent:
            'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36 Edge/12.0',
        os: 'windows',
        platform: 'win64',
        supportedBrowsers: {},
        browserState: {
            mobile: false,
            name: 'Microsoft Edge: 12.0; Windows: NT 10.0;',
            osname: 'Windows',
            outdated: false,
            supported: false,
        },
    },
];

describe('env/browser/browserUtils', () => {
    FIXTURES.forEach(f => {
        it(`getOS: ${f.description}`, () => {
            const userAgent = jest.spyOn(navigator, 'userAgent', 'get');
            userAgent.mockReturnValue(f.userAgent!);
            expect(getOS()).toEqual(f.os);
        });

        it(`getBrowserState: ${f.description}`, () => {
            const userAgent = jest.spyOn(navigator, 'userAgent', 'get');
            userAgent.mockReturnValue(f.userAgent!);
            // @ts-ignore
            navigator.usb = f.usb;

            expect(getBrowserState(f.supportedBrowsers || config.supportedBrowsers)).toEqual(
                f.browserState,
            );
        });

        it(`getSuggestedPlatform: ${f.description}`, () => {
            const userAgent = jest.spyOn(navigator, 'userAgent', 'get');
            userAgent.mockReturnValue(f.userAgent!);

            expect(getSuggestedPlatform()).toEqual(f.platform);
        });
    });
});
