import * as env from '@suite-utils/env';
import * as fixtures from '../__fixtures__/env';

describe('isMacOs', () => {
    let navigatorPlatformGetter: any;

    beforeEach(() => {
        navigatorPlatformGetter = jest.spyOn(window.navigator, 'platform', 'get');
    });

    afterEach(() => {
        jest.resetModules();
    });

    fixtures.isMacOs.forEach(f => {
        it(f.description, () => {
            // @ts-ignore
            jest.spyOn(env, 'getProcessPlatform').mockImplementation(() => f.processPlatform);

            navigatorPlatformGetter.mockReturnValue(f.navigatorPlatform);

            expect(env.isMacOs()).toEqual(f.result);
        });
    });
});

describe('isWindows', () => {
    let navigatorPlatformGetter: any;

    beforeEach(() => {
        navigatorPlatformGetter = jest.spyOn(window.navigator, 'platform', 'get');
    });

    afterEach(() => {
        jest.resetModules();
    });

    fixtures.isWindows.forEach(f => {
        it(f.description, () => {
            // @ts-ignore
            jest.spyOn(env, 'getProcessPlatform').mockImplementation(() => f.processPlatform);

            navigatorPlatformGetter.mockReturnValue(f.navigatorPlatform);

            expect(env.isWindows()).toEqual(f.result);
        });
    });
});

describe('isLinux', () => {
    let navigatorPlatformGetter: any;
    let userAgentGetter: any;

    beforeEach(() => {
        navigatorPlatformGetter = jest.spyOn(window.navigator, 'platform', 'get');
        userAgentGetter = jest.spyOn(window.navigator, 'userAgent', 'get');
    });

    afterEach(() => {
        jest.resetModules();
    });

    fixtures.isLinux.forEach(f => {
        it(f.description, () => {
            // @ts-ignore
            jest.spyOn(env, 'getProcessPlatform').mockImplementation(() => f.processPlatform);

            userAgentGetter.mockReturnValue(f.userAgent);
            navigatorPlatformGetter.mockReturnValue(f.navigatorPlatform);

            expect(env.isLinux()).toEqual(f.result);
        });
    });
});

describe('isIOs', () => {
    let navigatorPlatformGetter: any;

    beforeEach(() => {
        navigatorPlatformGetter = jest.spyOn(window.navigator, 'platform', 'get');
    });

    afterEach(() => {
        jest.resetModules();
    });

    fixtures.isIOs.forEach(f => {
        it(f.description, () => {
            navigatorPlatformGetter.mockReturnValue(f.navigatorPlatform);

            expect(env.isIOs()).toEqual(f.result);
        });
    });
});

describe('isAndroid', () => {
    let userAgentGetter: any;

    beforeEach(() => {
        userAgentGetter = jest.spyOn(window.navigator, 'userAgent', 'get');
    });

    afterEach(() => {
        jest.resetModules();
    });

    fixtures.isAndroid.forEach(f => {
        it(f.description, () => {
            userAgentGetter.mockReturnValue(f.userAgent);

            expect(env.isAndroid()).toEqual(f.result);
        });
    });
});

describe('isChromeOS', () => {
    let userAgentGetter: any;

    beforeEach(() => {
        userAgentGetter = jest.spyOn(window.navigator, 'userAgent', 'get');
    });

    afterEach(() => {
        jest.resetModules();
    });

    fixtures.isChromeOS.forEach(f => {
        it(f.description, () => {
            userAgentGetter.mockReturnValue(f.userAgent);

            expect(env.isChromeOs()).toEqual(f.result);
        });
    });
});

describe('getOsName', () => {
    let navigatorPlatformGetter: any;
    let userAgentGetter: any;

    beforeEach(() => {
        navigatorPlatformGetter = jest.spyOn(window.navigator, 'platform', 'get');
        userAgentGetter = jest.spyOn(window.navigator, 'userAgent', 'get');
    });

    afterEach(() => {
        jest.resetModules();
    });

    fixtures.getOsName.forEach(f => {
        it(f.description, () => {
            // @ts-ignore
            jest.spyOn(env, 'getProcessPlatform').mockImplementation(() => f.processPlatform);

            userAgentGetter.mockReturnValue(f.userAgent);
            navigatorPlatformGetter.mockReturnValue(f.navigatorPlatform);

            expect(env.getOsName()).toEqual(f.result);
        });
    });
});
