import chalk from 'chalk';
import TrezorConnect from 'trezor-connect';
import fixtures from '../../__fixtures__';

const { getController, setup, skipTest, conditionalTest, initTrezorConnect } = global.Trezor;

let controller;

describe(`TrezorConnect methods`, () => {
    afterAll(done => {
        // reset controller at the end
        if (controller) {
            controller.dispose();
            controller = undefined;
        }
        done();
    });

    fixtures.forEach(testCase => {
        describe(`TrezorConnect.${testCase.method}`, () => {
            beforeAll(async () => {
                try {
                    if (!controller) {
                        controller = getController(testCase.method);
                        controller.on('error', () => {
                            controller = undefined;
                        });
                    }

                    await setup(controller, testCase.setup);

                    await initTrezorConnect(controller);
                    // done();
                } catch (error) {
                    console.log('Controller WS init error', error);
                    // done(error);
                }
            }, 40000);

            afterAll(done => {
                TrezorConnect.dispose();
                done();
            });

            testCase.tests.forEach(t => {
                // check if test should be skipped on current configuration
                conditionalTest(
                    t.skip,
                    t.description,
                    async () => {
                        // print current test case, `jest` default reporter doesn't log this. see https://github.com/facebook/jest/issues/4471
                        if (typeof jest !== 'undefined' && process.stderr) {
                            const log = chalk.black.bgYellow.bold(` ${testCase.method}: `);
                            process.stderr.write(`\n${log} ${chalk.bold(t.description)}\n`);
                        }

                        if (!controller) {
                            throw new Error('Controller not found');
                        }

                        // single test may require a different setup
                        await setup(controller, t.setup || testCase.setup);

                        controller.options.name = t.description;
                        const result = await TrezorConnect[testCase.method](t.params);
                        console.log('===result', result);
                        let expected = t.result
                            ? { success: true, payload: t.result }
                            : { success: false };

                        // find legacy result
                        if (t.legacyResults) {
                            t.legacyResults.forEach(r => {
                                if (skipTest(r.rules)) {
                                    expected = r.payload
                                        ? { success: true, payload: r.payload }
                                        : { success: false };
                                }
                            });
                        }

                        expect(result).toMatchObject(expected);
                        // done();
                    },
                    t.customTimeout || 20000,
                );
            });
        });
    });
});
