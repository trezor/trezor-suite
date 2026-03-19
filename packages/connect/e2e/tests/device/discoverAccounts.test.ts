// eslint-disable-next-line import/no-extraneous-dependencies
import TrezorConnect, { type BundleProgress, UI_REQUEST } from '@trezor/connect';
import type { DiscoverAccountsProgress } from '@trezor/connect/src/types/api/discoverAccounts';

import { getController, initTrezorConnect, setup } from '../../common.setup';

let controller: ReturnType<typeof getController> | undefined;

const setupSettings: TestCase['setup'] = { mnemonic: 'mnemonic_all' };

describe(`TrezorConnect.discoverAccounts`, () => {
    beforeAll(async () => {
        TrezorConnect.dispose();

        try {
            if (!controller) {
                controller = getController();
            }

            await setup(controller, setupSettings);

            await initTrezorConnect(controller);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.log('Controller WS init error', error);
        }
    }, 40000);

    afterAll(() => {
        // reset controller at the end
        controller?.dispose();
        controller = undefined;
    });

    afterEach(() => {
        TrezorConnect.cancel();
    });

    it('TEST', async () => {
        // print current test case for better debugging visibility
        if (typeof process !== 'undefined' && process.stderr) {
            process.stderr.write(`\n${'TrezorConnect.discoverAccounts'}: ${'test'}\n`);
        }

        if (!controller) {
            throw new Error('Controller not found');
        }

        const onBundleProgress = (_event: BundleProgress<DiscoverAccountsProgress>['payload']) => {
            /*
            const { response, ...rest } = event;
            if ('error' in response) {
                console.log('PROGRESS ERROR', { ...rest, response });
            } else {
                console.log('PROGRESS', {
                    ...rest,
                    account: {
                        descriptor: response.descriptor,
                        txs: response.history.total,
                        symbol: response.symbol,
                        path: response.path,
                        type: response.type,
                        index: response.index,
                    },
                });
            }
            */
        };

        TrezorConnect.on(UI_REQUEST.BUNDLE_PROGRESS, onBundleProgress);
        /*
        new Promise(resolve => setTimeout(resolve, 600)).then(() =>
            TrezorConnect.cancel('CANCELLED'),
        );
        */

        const result = await TrezorConnect.discoverAccounts({
            coins: [
                { symbol: 'btc', known: [{ type: 'legacy' }, { type: 'taproot' }] },
                { symbol: 'eth' },
                { symbol: 'etc', known: [{ type: 'normal', skip: 4 }], knownOnly: true },
                { symbol: 'ltc' },
                { symbol: 'ada' },
                { symbol: 'xrp' },
            ] as Parameters<typeof TrezorConnect.discoverAccounts>[0]['coins'],
            useCardanoDerivation: true,
        });

        TrezorConnect.off(UI_REQUEST.BUNDLE_PROGRESS, onBundleProgress);

        expect(result).toMatchObject({});
    }, 180000);
});
