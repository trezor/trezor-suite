import TrezorConnect from '../../../src';

// error thrown by .init()
const INIT_ERROR = { code: 'Init_ManifestMissing' };

describe('TrezorConnect.init', () => {
    afterEach(async () => {
        await TrezorConnect.dispose();
    });

    beforeAll(() => {
        // use local build, not trezor connect version hosted on trezor.connect.io
        // @ts-expect-error
        global.__TREZOR_CONNECT_SRC = process.env.TREZOR_CONNECT_SRC;
    });

    it('calling method before .init() and/or .manifest()', async () => {
        const { payload } = await TrezorConnect.getCoinInfo({ coin: 'btc' });
        expect(payload).toMatchObject(INIT_ERROR);
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
            manifest: { appUrl: 'a', email: 'b' },
        });

        try {
            await TrezorConnect.init({ manifest: { appUrl: 'a', email: 'b' } });
            throw new Error('Should not be resolved');
        } catch (error) {
            expect(error).toMatchObject({ code: 'Init_AlreadyInitialized' });
        }
    });

    it('init success', async () => {
        await TrezorConnect.init({ manifest: { appUrl: 'a', email: 'b' } });

        const resp = await TrezorConnect.getCoinInfo({ coin: 'btc' });
        expect(resp).toMatchObject({
            payload: { type: 'bitcoin', shortcut: 'BTC' },
        });
    });

    it('manifest success', async () => {
        TrezorConnect.manifest({
            appUrl: 'a',
            email: 'b',
        });
        const resp = await TrezorConnect.getCoinInfo({ coin: 'btc' });
        expect(resp).toMatchObject({
            payload: { type: 'bitcoin', shortcut: 'BTC' },
        });
    });
});
