// eslint-disable-next-line import/no-extraneous-dependencies
import TrezorConnect from '@trezor/connect';

import * as fixtures from '../../__fixtures__';
import {
    conditionalTest,
    getCapturedScreens,
    getController,
    initTrezorConnect,
    resetCapturedScreens,
    setScreenCaptureEnabled,
    setup,
    skipTest,
} from '../../common.setup';

const normalizeScreen = (s: string) => s.replace(/\s+/g, '');

let controller: ReturnType<typeof getController> | undefined;

// After the removal bip69, we sort inputs and outputs randomly
// So we need to mock the source of randomness for all tests, so the fixtures are deterministic.
// The deterministic getRandomInt is injected via resolve.alias in vitest.config.ts,
// which redirects the @trezor/utils/src/getRandomInt module to a deterministic mock.

// This is mock of randomness for browser environment (overrides window.crypto.getRandomValues
// so that the real getRandomInt — if somehow loaded — also produces deterministic output).
if (typeof window !== 'undefined') {
    window.crypto.getRandomValues = array => {
        if (array instanceof Uint32Array) {
            array[0] = 4;
        }

        return array;
    };
}

const getFixtures = () => {
    const includedMethods = process.env.TESTS_INCLUDED_METHODS;
    const excludedMethods = process.env.TESTS_EXCLUDED_METHODS;
    let subset = Object.values(fixtures);
    if (includedMethods) {
        const methodsArr = includedMethods.split(',');
        subset = subset.filter(f => methodsArr.includes(f.method));
    } else if (excludedMethods) {
        const methodsArr = excludedMethods.split(',');
        subset = subset.filter(f => !methodsArr.includes(f.method));
    }

    // sort by mnemonic to avoid emu re-loading
    const result = subset?.sort((a, b) => {
        if (!a.setup.mnemonic || !b.setup.mnemonic) return 0;
        if (a.setup.mnemonic > b.setup.mnemonic) return 1;
        if (b.setup.mnemonic > a.setup.mnemonic) return -1;

        return 0;
    });

    return result || [];
};

let lastSetupConfig: TestCase['setup'] | null = null;

describe(`TrezorConnect methods`, () => {
    afterAll(() => {
        // reset controller at the end
        if (controller) {
            controller.dispose();
            controller = undefined;
        }
    });

    getFixtures().forEach((testCase: TestCase) => {
        describe(`TrezorConnect.${testCase.method}`, () => {
            beforeAll(async () => {
                TrezorConnect.dispose();

                try {
                    if (!controller) {
                        controller = getController();
                        // controller.on('error', () => {
                        //     controller = undefined;
                        // });
                    }

                    await setup(controller, testCase.setup);
                    lastSetupConfig = testCase.setup;

                    await initTrezorConnect(controller);
                } catch (error) {
                    // eslint-disable-next-line no-console
                    console.log('Controller WS init error', error);
                }
            }, 40000);

            afterEach(() => {
                TrezorConnect.cancel();
            });

            beforeEach(() => {
                resetCapturedScreens();
            });

            testCase.tests.forEach(t => {
                // check if test should be skipped on current configuration
                conditionalTest(
                    t.skip,
                    t.description,
                    async () => {
                        setScreenCaptureEnabled(t.deviceScreen !== undefined);

                        if (!controller) {
                            throw new Error('Controller not found');
                        }

                        // single test may require a different setup
                        const setupConfig = t.setup || testCase.setup;
                        if (
                            setupConfig.wiped ||
                            JSON.stringify(setupConfig) !== JSON.stringify(lastSetupConfig)
                        ) {
                            await setup(controller, setupConfig);
                            lastSetupConfig = setupConfig;
                        }

                        // @ts-expect-error, string + params union
                        const result = await TrezorConnect[testCase.method](t.params);
                        let expected = t.result
                            ? { success: true, payload: t.result }
                            : { success: false };

                        // find legacy result
                        const { legacyResults } = t;
                        if (legacyResults) {
                            legacyResults.forEach(r => {
                                if (skipTest(r.rules)) {
                                    expected = r.payload
                                        ? { success: true, payload: r.payload }
                                        : { success: false };
                                }
                            });
                        }

                        expect(result).toMatchObject(expected);

                        const { deviceScreen } = t;
                        // Skip the screen assertion when the matrix expects failure
                        // (no ButtonRequest emitted), or when the fixture flags this
                        // matrix as skip via deviceScreenSkip (T1B1 returns a
                        // placeholder, old FW renders differently). Smaller screens
                        // truncate the visible portion, so the substring/regex match
                        // runs against the concatenation of all captures.
                        const skipScreen = t.deviceScreenSkip && skipTest(t.deviceScreenSkip);
                        if (deviceScreen !== undefined && expected.success && !skipScreen) {
                            const screens = getCapturedScreens();
                            expect(screens.length).toBeGreaterThan(0);
                            const joined = screens.map(normalizeScreen).join('');
                            if (typeof deviceScreen === 'string') {
                                expect(joined).toContain(normalizeScreen(deviceScreen));
                            } else {
                                expect(deviceScreen.test(joined)).toBe(true);
                            }
                        }
                    },
                    t.customTimeout || 40000,
                );
            });
        });
    });
});
