// eslint-disable-next-line import/no-extraneous-dependencies
import TrezorConnect from '@trezor/connect';

// error thrown by .init()
const INIT_ERROR = { code: 'Init_ManifestMissing' };

describe('TrezorConnect.init', () => {
    afterEach(() => {
        TrezorConnect.dispose();
    });

    it('calling method before .init()', async () => {
        const result = await TrezorConnect.getCoinInfo({ coin: 'btc' });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toMatchObject(INIT_ERROR);
        }
    });

    it('missing manifest in TrezorConnect.init', async () => {
        try {
            // @ts-expect-error
            await TrezorConnect.init();
            throw new Error('Should not be resolved');
        } catch (error) {
            expect(error).toMatchObject(INIT_ERROR);
        }
    });

    it('invalid manifest in TrezorConnect.init', async () => {
        try {
            // @ts-expect-error
            await TrezorConnect.init({ manifest: {} });
            throw new Error('Should not be resolved');
        } catch (error) {
            expect(error).toMatchObject(INIT_ERROR);
        }
    });

    it('calling .init() multiple times', async () => {
        await TrezorConnect.init({
            manifest: { appName: 'a', appUrl: 'a', email: 'b' },
        });

        try {
            await TrezorConnect.init({
                manifest: { appName: 'a', appUrl: 'a', email: 'b' },
            });
            throw new Error('Should not be resolved');
        } catch (error) {
            expect(error).toMatchObject({ code: 'Init_AlreadyInitialized' });
        }
    });

    it('calling multiple methods synchronously', async () => {
        await TrezorConnect.init({
            manifest: { appName: 'a', appUrl: 'a', email: 'b' },
        });

        const result = await Promise.all([
            TrezorConnect.getCoinInfo({ coin: 'btc' }),
            TrezorConnect.blockchainEstimateFee({ request: { blocks: [1] }, coin: 'test' }),
        ]);

        // success, success
        expect(result.map(r => r.success)).toEqual([true, true]);
    });

    it('init success', async () => {
        await TrezorConnect.init({
            manifest: { appName: 'a', appUrl: 'a', email: 'b' },
        });

        const resp = await TrezorConnect.getCoinInfo({ coin: 'btc' });
        expect(resp).toMatchObject({
            payload: { type: 'bitcoin', shortcut: 'BTC' },
        });
    });
});
