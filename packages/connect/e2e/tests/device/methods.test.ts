import TrezorConnect from '../../../src';
import * as fixtures from '../../__fixtures__';

import {
    getController,
    skipTest,
    setup,
    conditionalTest,
    initTrezorConnect,
} from '../../common.setup';

let controller: ReturnType<typeof getController> | undefined;

const getFixtures = () => {
    const includedMethods = process.env.TESTS_INCLUDED_METHODS;
    const excludedMethods = process.env.TESTS_EXCLUDED_METHODS;
    let subset = Object.values(fixtures);
    if (includedMethods) {
        const methodsArr = includedMethods.split(',');
        subset = subset.filter(f => methodsArr.some(includedM => includedM === f.method));
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
                await TrezorConnect.dispose();

                try {
                    if (!controller) {
                        controller = getController();
                        // controller.on('error', () => {
                        //     controller = undefined;
                        // });
                    }

                    await setup(controller, testCase.setup);

                    await initTrezorConnect(controller);
                } catch (error) {
                    // eslint-disable-next-line no-console
                    console.log('Controller WS init error', error);
                }
            }, 40000);

            afterEach(() => {
                TrezorConnect.cancel();
            });

            testCase.tests.forEach(t => {
                // check if test should be skipped on current configuration
                conditionalTest(
                    t.skip,
                    t.description,
                    async () => {
                        // print current test case, `jest` default reporter doesn't log this. see https://github.com/facebook/jest/issues/4471
                        if (typeof jest !== 'undefined' && process.stderr) {
                            process.stderr.write(`\n${testCase.method}: ${t.description}\n`);
                        }

                        if (!controller) {
                            throw new Error('Controller not found');
                        }

                        // single test may require a different setup
                        await setup(controller, t.setup || testCase.setup);

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
                    },
                    t.customTimeout || 20000,
                );
            });
        });
    });
});
