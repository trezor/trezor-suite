/* eslint-disable import/no-named-as-default */

import { createDeferred } from '@trezor/utils/lib';
import TrezorConnect from '../../../src';

const { getController, setup, initTrezorConnect } = global.Trezor;

const controller = getController();

describe('TrezorConnect concurrence model', () => {
    beforeEach(async () => {
        await setup(controller, {
            mnemonic: 'mnemonic_all',
            passphrase_protection: true,
        });
        await initTrezorConnect(controller, { debug: false });
    });

    afterEach(async () => {
        controller.dispose();
        await TrezorConnect.dispose();
    });

    test('the expected way -> called serially', async () => {
        const response1 = await TrezorConnect.getAddress({
            coin: 'btc',
            path: "m/49'/0'/0'/0/0",
            useEmptyPassphrase: true,
            showOnTrezor: false,
        });
        if (!response1.success) {
            throw new Error(`error: ${response1.payload.error}`);
        }

        const response2 = await TrezorConnect.getAddress({
            coin: 'btc',
            path: "m/49'/0'/0'/0/0",
            useEmptyPassphrase: true,
            showOnTrezor: false,
        });
        if (!response2.success) {
            throw new Error(`error: ${response2.payload.error}`);
        }
    });

    test('called in parallel', async () => {
        const resolve1Promise = createDeferred();
        const resolve2Promise = createDeferred();

        TrezorConnect.getAddress({
            coin: 'btc',
            path: "m/49'/0'/0'/0/0",
            useEmptyPassphrase: true,
            showOnTrezor: false,
        })
            .then(res => {
                expect(res.success).toEqual(true);
            })
            .finally(() => {
                resolve1Promise.resolve();
            });

        TrezorConnect.getAddress({
            coin: 'btc',
            path: "m/49'/0'/0'/0/0",
            useEmptyPassphrase: true,
            showOnTrezor: false,
        })
            .then(res => {
                if (!res.success) {
                    expect(res.payload.error).toEqual('Device call in progress');
                } else {
                    throw new Error('unexpected result');
                }
            })
            .finally(() => {
                resolve2Promise.resolve();
            });

        await resolve1Promise.promise;
        await resolve2Promise.promise;
    });

    test('called in parallel after device was already loaded', async () => {
        const resolve1Promise = createDeferred();
        const resolve2Promise = createDeferred();

        await TrezorConnect.getAddress({
            coin: 'btc',
            path: "m/49'/0'/0'/0/0",
            useEmptyPassphrase: true,
            showOnTrezor: false,
        });

        TrezorConnect.getAddress({
            coin: 'btc',
            path: "m/49'/0'/0'/0/0",
            useEmptyPassphrase: true,
            showOnTrezor: false,
        })
            .then(res => {
                expect(res.success).toEqual(true);
            })
            .finally(() => {
                resolve1Promise.resolve();
            });

        TrezorConnect.getAddress({
            coin: 'btc',
            path: "m/49'/0'/0'/0/0",
            useEmptyPassphrase: true,
        })
            .then(res => {
                if (!res.success) {
                    expect(res.payload.error).toEqual('Device call in progress');
                } else {
                    throw new Error('unexpected result');
                }
            })
            .finally(() => {
                resolve2Promise.resolve();
            });

        await resolve1Promise.promise;
        await resolve2Promise.promise;
    });

    const timeouts = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024];
    timeouts.forEach(timeout => {
        test(`2nd call called in parallel between first call start and end (timeout ${timeout}ms)`, async () => {
            const resolve1Promise = createDeferred();
            const resolve2Promise = createDeferred();

            TrezorConnect.getAddress({
                coin: 'btc',
                path: "m/49'/0'/0'/0/0",
                useEmptyPassphrase: true,
                showOnTrezor: false,
            })
                .then(res => {
                    expect(res.success).toEqual(true);
                    // @ts-ignore
                    resolve1Promise.resolved = true;
                })
                .finally(() => {
                    resolve1Promise.resolve();
                });

            setTimeout(() => {
                // @ts-ignore
                if (resolve1Promise.resolved) {
                    // first call takes ~1 second. it could be already resolved, if yes, skip this test
                    return;
                }
                TrezorConnect.getAddress({
                    coin: 'btc',
                    path: "m/49'/0'/0'/0/0",
                    useEmptyPassphrase: true,
                })
                    .then(res => {
                        if (!res.success) {
                            expect(res.payload.error).toEqual('Device call in progress');
                        } else {
                            throw new Error('unexpected result');
                        }
                    })
                    .finally(() => {
                        resolve2Promise.resolve();
                    });
            }, timeout);

            await resolve1Promise.promise;
            await resolve2Promise.promise;
        });
    });

    test('called serially after first call fails', async () => {
        const allAssertionsPromise = createDeferred();
        const buttonReqPromise = new Promise<void>(resolve => {
            TrezorConnect.on('ui-button', () => {
                resolve();
                TrezorConnect.removeAllListeners('ui-button');
            });
        });
        const response1 = TrezorConnect.getAddress({
            coin: 'btc',
            path: "m/49'/0'/0'/0/0",
            useEmptyPassphrase: true,
            showOnTrezor: true,
        });

        // this causes the first call to go though onCall catch block
        await buttonReqPromise;
        controller.send({ type: 'emulator-press-no' });

        response1
            .then(res => {
                expect(res.success).toEqual(false);
            })
            .then(() =>
                TrezorConnect.getAddress({
                    coin: 'btc',
                    path: "m/49'/0'/0'/0/0",
                    useEmptyPassphrase: true,
                    showOnTrezor: false,
                }),
            )
            .then(res => {
                expect(res.success).toEqual(true);
            })
            .then(() =>
                TrezorConnect.getAddress({
                    coin: 'btc',
                    path: "m/49'/0'/0'/0/0",
                    useEmptyPassphrase: true,
                    showOnTrezor: false,
                }),
            )
            .then(res => {
                expect(res.success).toEqual(true);
            })
            .finally(() => {
                allAssertionsPromise.resolve();
            });

        await allAssertionsPromise.promise;
    });
});
