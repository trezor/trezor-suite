import TrezorConnect from '@trezor/connect';

const { getController, setup, initTrezorConnect } = global.Trezor;

const controller = getController('setBusy');

describe('TrezorConnect override param', () => {
    beforeAll(async () => {
        await setup(controller, { mnemonic: 'mnemonic_all' });
        await initTrezorConnect(controller);
    });

    afterAll(async () => {
        controller.dispose();
        await TrezorConnect.dispose();
    });

    it('override previous call', async () => {
        TrezorConnect.getAddress({
            path: "m/44'/1'/0'/0/0",
        }).then(response => {
            expect(response.success).toBe(false);
            // TODO: received error depends on timeout below
            // expect(response.payload).toMatchObject({ code: 'Method_Override' });
        });

        // TODO: immediate call causes race condition in bridge http request, test might be flaky
        // requires AbortController implementation in @trezor/transport to cancel current request to bridge (acquire process)
        await new Promise(resolve => setTimeout(resolve, 1000));

        const address = await TrezorConnect.getAddress({
            path: "m/44'/1'/0'/0/0",
            override: true,
        });
        expect(address.success).toBe(true);
    });
});
