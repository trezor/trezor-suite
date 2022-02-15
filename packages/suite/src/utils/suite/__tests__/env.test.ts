import * as env from '@suite-utils/env';
import * as fixtures from '../__fixtures__/env';

// TODO: this tests should be reworked due to mocking problem because of compilation.
// Problem is when mocking function inside of module for example jest.spyOn(env, 'getProcessPlatform')
// You can call env.getProcessPlatform() here and you will get correct mocked result, but if you call
// env.isMacOs() that uses getProcessPlatform() internally, this internal call of function won't be mocked.
// Problem is how compilers transpile imports/export, and this was probably some feature(bug) in ts-jest that
// it was possible. All compilers were tried (babel, swc, esbuild) and it behaves same in all of them.

describe.skip('isMacOs', () => {
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

describe.skip('isWindows', () => {
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

describe.skip('isLinux', () => {
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

describe.skip('isIOs', () => {
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

describe.skip('isAndroid', () => {
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

describe.skip('isChromeOS', () => {
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

describe.skip('getOsName', () => {
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
