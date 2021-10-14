export const isMacOs = [
    {
        description: 'should be MacOs according to process.platform',
        processPlatform: 'darwin',
        navigatorPlatform: '',
        result: true,
    },
    {
        description: 'should not be MacOs according to process.platform',
        processPlatform: 'win32',
        navigatorPlatform: '',
        result: false,
    },
    {
        description: 'should be MacOs according to window.navigator.platform',
        processPlatform: '',
        navigatorPlatform: 'MacIntel',
        result: true,
    },
    {
        description: 'should not be MacOs according to window.navigator.platform',
        processPlatform: '',
        navigatorPlatform: 'Win32',
        result: false,
    },
];

export const isWindows = [
    {
        description: 'should be Windows according to process.platform',
        processPlatform: 'win32',
        navigatorPlatform: '',
        result: true,
    },
    {
        description: 'should not be Windows according to process.platform',
        processPlatform: 'darwin',
        navigatorPlatform: '',
        result: false,
    },
    {
        description: 'should be Windows according to window.navigator.platform',
        processPlatform: '',
        navigatorPlatform: 'Win32',
        result: true,
    },
    {
        description: 'should not be Windows according to window.navigator.platform',
        processPlatform: '',
        navigatorPlatform: 'MacIntel',
        result: false,
    },
];

export const isLinux = [
    {
        description: 'should be Linux according to process.platform, userAgent should be ignored',
        processPlatform: 'linux',
        userAgent:
            'Mozilla/5.0 (Linux; Android 11; SM-A102U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.72 Mobile Safari/537.36',
        navigatorPlatform: '',
        result: true,
    },
    {
        description:
            'should not be Linux according to process.platform, userAgent should be ignored',
        processPlatform: 'darwin',
        userAgent: 'Mozilla/5.0 (X11; Ubuntu; Linux i686; rv:24.0) Gecko/20100101 Firefox/24.0',
        navigatorPlatform: '',
        result: false,
    },
    {
        description:
            'should be Linux according to window.navigator.platform, userAgent should be ignored',
        processPlatform: '',
        userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.87 Safari/537.366',
        navigatorPlatform: 'Linux armv7l',
        result: true,
    },
    {
        description:
            'should not be Linux according to window.navigator.platform, userAgent should be ignored',
        processPlatform: '',
        userAgent: 'Mozilla/5.0 (X11; Ubuntu; Linux i686; rv:24.0) Gecko/20100101 Firefox/24.0',
        navigatorPlatform: 'Win32',
        result: false,
    },
    {
        description: 'should not be Linux as it should be Android according to userAgent',
        processPlatform: '',
        userAgent:
            'Mozilla/5.0 (Linux; Android 11; SM-A102U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.72 Mobile Safari/537.36',
        navigatorPlatform: 'Linux armv7l',
        result: false,
    },
    {
        description: 'should not be Linux as it should be Chrome OS according to userAgent',
        processPlatform: '',
        userAgent:
            'Mozilla/5.0 (X11; CrOS x86_64 14150.57.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.97 Safari/537.36',
        navigatorPlatform: 'Linux armv7l',
        result: false,
    },
];

export const isIOs = [
    {
        description: 'should be iOS on iPhone device',
        navigatorPlatform: 'iPhone',
        result: true,
    },
    {
        description: 'should be iOS on iPod device',
        navigatorPlatform: 'iPod',
        result: true,
    },
    {
        description: 'should be iOS on iPad device',
        navigatorPlatform: 'iPad',
        result: true,
    },
    {
        description: 'should not be iOS on Android device',
        navigatorPlatform: 'Android',
        result: false,
    },
];

export const isAndroid = [
    {
        description: 'should be Android on Samsung device',
        userAgent:
            'Mozilla/5.0 (Linux; Android 11; SM-A102U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.72 Mobile Safari/537.36',
        result: true,
    },
    {
        description: 'should be Android on Nexus One device',
        userAgent:
            'Mozilla/5.0 (Linux; U; Android 2.2.1; en-us; Nexus One Build/FRG83) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1',
        result: true,
    },
    {
        description: 'should be Android on Lenovo device',
        userAgent:
            'Mozilla/5.0 (Linux; Android 5.1.1; Lenovo-A6020l36 Build/LMY47V) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.93 Mobile Safari/537.36',
        result: true,
    },
    {
        description: 'should not be Android on iPad device',
        userAgent:
            'Mozilla/5.0 (iPad; CPU OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
        result: false,
    },
];

export const isChromeOS = [
    {
        description: 'should be ChromeOS',
        userAgent:
            'Mozilla/5.0 (X11; CrOS x86_64 14150.57.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.97 Safari/537.36',
        result: true,
    },
    {
        description: 'should not be ChromeOS',
        userAgent:
            'Mozilla/5.0 (Linux; U; Android 2.2.1; en-us; Nexus One Build/FRG83) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1',
        result: false,
    },
];

export const getOsName = [
    {
        description: 'should be Windows 1',
        processPlatform: 'win32',
        navigatorPlatform: '',
        userAgent: '',
        result: 'windows',
    },
    {
        description: 'should be Windows 2',
        processPlatform: '',
        navigatorPlatform: 'Win32',
        userAgent: '',
        result: 'windows',
    },
    {
        description: 'should be macOS 1',
        processPlatform: 'darwin',
        navigatorPlatform: '',
        userAgent: '',
        result: 'macos',
    },
    {
        description: 'should be macOS 2',
        processPlatform: '',
        navigatorPlatform: 'MacIntel',
        userAgent: '',
        result: 'macos',
    },
    {
        description: 'should be Android 1',
        processPlatform: '',
        navigatorPlatform: 'Linux',
        userAgent:
            'Mozilla/5.0 (Linux; Android 11; SM-A102U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.72 Mobile Safari/537.36',
        result: 'android',
    },
    {
        description: 'should be Android 2',
        processPlatform: '',
        navigatorPlatform: 'Linux',
        userAgent:
            'Mozilla/5.0 (Linux; U; Android 2.2.1; en-us; Nexus One Build/FRG83) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1',
        result: 'android',
    },
    {
        description: 'should be Android 3',
        processPlatform: '',
        navigatorPlatform: 'Android',
        userAgent:
            'Mozilla/5.0 (Linux; Android 5.1.1; Lenovo-A6020l36 Build/LMY47V) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.93 Mobile Safari/537.36',
        result: 'android',
    },
    {
        description: 'should be ChromeOS 1',
        processPlatform: '',
        navigatorPlatform: 'Linux',
        userAgent:
            'Mozilla/5.0 (X11; CrOS x86_64 14150.57.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.97 Safari/537.36',
        result: 'chromeos',
    },
    {
        description: 'should be Linux 1',
        processPlatform: 'linux',
        navigatorPlatform: '',
        userAgent: '',
        result: 'linux',
    },
    {
        description: 'should be Linux 2',
        processPlatform: '',
        navigatorPlatform: 'Linux',
        userAgent: '',
        result: 'linux',
    },
    {
        description: 'should be Linux 3',
        processPlatform: '',
        navigatorPlatform: 'Linux',
        userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.87 Safari/537.36',
        result: 'linux',
    },
    {
        description: 'should be iOS 1',
        processPlatform: '',
        navigatorPlatform: 'iPhone',
        userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.87 Safari/537.36',
        result: 'ios',
    },
];
