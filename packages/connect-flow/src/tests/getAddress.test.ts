import { createConnectService } from '../createConnectService';
import { createTrezorConnectMock } from '../mock';
import { UI_REQUEST } from '../trezorConnectLike';

describe('createConnectService.getAddress', () => {
    it('passes callId into TrezorConnect.getAddress and resolves toPromise with the result', async () => {
        const mock = createTrezorConnectMock();
        const service = createConnectService({ trezorConnect: mock });

        const proc = service.getAddress({
            devicePath: 'p1',
            path: "m/44'/0'/0'/0/0",
            coin: 'btc',
            showOnTrezor: true,
        });
        const final = proc.toPromise();

        expect(mock.getAddressCalls).toEqual([
            {
                device: { path: 'p1' },
                path: "m/44'/0'/0'/0/0",
                coin: 'btc',
                showOnTrezor: true,
                callId: proc.callId,
            },
        ]);

        mock.resolveGetAddress({
            address: 'bc1qxyz',
            path: [44, 0, 0, 0, 0],
            serializedPath: "m/44'/0'/0'/0/0",
        });

        await expect(final).resolves.toEqual({
            address: 'bc1qxyz',
            path: [44, 0, 0, 0, 0],
            serializedPath: "m/44'/0'/0'/0/0",
        });
    });

    it('yields a request_button subprocess when device asks for confirmation', async () => {
        const mock = createTrezorConnectMock();
        const service = createConnectService({ trezorConnect: mock });

        const proc = service.getAddress({
            path: "m/44'/0'/0'/0/0",
            showOnTrezor: true,
        });
        const iter = proc.run();

        const p1 = iter.next();
        mock.emit({
            type: 'ui-button',
            payload: { device: { path: 'p1' }, code: 'ButtonRequest_Address' },
            callId: proc.callId,
        });
        const s1 = await p1;
        expect(s1.value.type).toBe(UI_REQUEST.REQUEST_BUTTON);
        if (s1.value.type === UI_REQUEST.REQUEST_BUTTON) {
            expect(s1.value.payload.code).toBe('ButtonRequest_Address');
        }

        // Resolving the call ends the stream (no terminal subprocess) and the
        // result is delivered via toPromise().
        mock.resolveGetAddress({
            address: 'bc1qabc',
            path: [44, 0, 0, 0, 0],
            serializedPath: "m/44'/0'/0'/0/0",
        });
        const next = await iter.next();
        expect(next.done).toBe(true);
        await expect(proc.toPromise()).resolves.toMatchObject({ address: 'bc1qabc' });
    });

    it('toPromise() resolves with the address result', async () => {
        const mock = createTrezorConnectMock();
        const service = createConnectService({ trezorConnect: mock });

        const proc = service.getAddress({ path: "m/44'/0'/0'/0/0" });
        const finalP = proc.toPromise();

        mock.resolveGetAddress({
            address: 'bc1qhello',
            path: [44, 0, 0, 0, 0],
            serializedPath: "m/44'/0'/0'/0/0",
        });

        await expect(finalP).resolves.toEqual({
            address: 'bc1qhello',
            path: [44, 0, 0, 0, 0],
            serializedPath: "m/44'/0'/0'/0/0",
        });
    });
});
