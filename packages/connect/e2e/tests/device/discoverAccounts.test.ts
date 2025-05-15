import TrezorConnect, { BundleProgress, UI } from '../../../src';
import type { DiscoverAccountsProgress } from '../../../src/types/api/discoverAccounts';
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
        // print current test case, `jest` default reporter doesn't log this. see https://github.com/facebook/jest/issues/4471
        if (typeof jest !== 'undefined' && process.stderr) {
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

        TrezorConnect.on<DiscoverAccountsProgress>(UI.BUNDLE_PROGRESS, onBundleProgress);

        const result = await TrezorConnect.discoverAccounts({
            accounts: [
                { symbol: 'btc', type: 'legacy' },
                { symbol: 'btc', type: 'segwit' },
                { symbol: 'btc', type: 'taproot' },
                { symbol: 'eth' },
                { symbol: 'etc', type: 'normal', skip: 4 },
                { symbol: 'ltc' },
                { symbol: 'ada' },
                { symbol: 'xrp' },
            ],
            useCardanoDerivation: true,
        });

        TrezorConnect.off(UI.BUNDLE_PROGRESS, onBundleProgress);

        expect(result).toMatchObject({});
    }, 180000);
});
