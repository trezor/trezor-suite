/* eslint-disable import/no-named-as-default */

import TrezorConnect from '../../../src';
import fixtures from '../../__fixtures__';

const { getController, setup, skipTest, conditionalTest, initTrezorConnect } = global.Trezor;

let controller: ReturnType<typeof getController> | undefined;

describe(`TrezorConnect methods`, () => {
    afterAll(() => {
        // reset controller at the end
        if (controller) {
            controller.dispose();
            controller = undefined;
        }
    });

    fixtures.forEach((testCase: TestCase) => {
        describe(`TrezorConnect.${testCase.method}`, () => {
            beforeAll(async () => {
                await TrezorConnect.dispose();

                try {
                    if (!controller) {
                        controller = getController(testCase.method);
                        controller.on('error', () => {
                            controller = undefined;
                        });
                    }

                    await setup(controller, testCase.setup);

                    await initTrezorConnect(controller);
                } catch (error) {
                    // eslint-disable-next-line no-console
                    console.log('Controller WS init error', error);
                }
            }, 40000);

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

                        controller.options.name = t.description;
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
