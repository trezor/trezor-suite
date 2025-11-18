import TrezorConnect from '../../../src';

// error thrown by .init()
const INIT_ERROR = { code: 'Init_ManifestMissing' };

describe('TrezorConnect.init', () => {
    afterEach(() => {
        TrezorConnect.dispose();
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
            manifest: { appName: 'a', appUrl: 'a', email: 'b' },
            coreMode: 'iframe', // for connect-web
        });

        try {
            await TrezorConnect.init({
                manifest: { appName: 'a', appUrl: 'a', email: 'b' },
                coreMode: 'iframe', // for connect-web
            });
            throw new Error('Should not be resolved');
        } catch (error) {
            expect(error).toMatchObject({ code: 'Init_AlreadyInitialized' });
        }
    });

    it('calling multiple methods synchronously', async () => {
        await TrezorConnect.init({
            manifest: { appName: 'a', appUrl: 'a', email: 'b' },
            coreMode: 'iframe', // for connect-web
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
            coreMode: 'iframe', // for connect-web
        });

        const resp = await TrezorConnect.getCoinInfo({ coin: 'btc' });
        expect(resp).toMatchObject({
            payload: { type: 'bitcoin', shortcut: 'BTC' },
        });
    });

    // manifest doesn't allow us to control the coreMode, therefore the test won't run
    it.skip('manifest success', async () => {
        TrezorConnect.manifest({
            appName: 'a',
            appUrl: 'a',
            email: 'b',
        });
        const resp = await TrezorConnect.getCoinInfo({ coin: 'btc' });
        expect(resp).toMatchObject({
            payload: { type: 'bitcoin', shortcut: 'BTC' },
        });
    });
});
