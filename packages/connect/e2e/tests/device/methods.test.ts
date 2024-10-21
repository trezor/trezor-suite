import TrezorConnect from '../../../src';
import fixtures from '../../__fixtures__';

import {
    getController,
    skipTest,
    setup,
    conditionalTest,
    initTrezorConnect,
} from '../../common.setup';

let controller: ReturnType<typeof getController> | undefined;

jest.mock('@trezor/utils', () => ({
    ...jest.requireActual('@trezor/utils'),

    // After the removal bip69, we sort inputs and outputs randomly
    // So we need to mock the source of randomness for all tests, so the fixtures are deterministic
    getRandomInt: (min: number, max: number) => min + (4 % max), // 4 is truly random number, I rolled the dice
}));

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
