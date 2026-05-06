import { createConnectService } from '../createConnectService';
import { createTrezorConnectMock } from '../mock';
import { UI_REQUEST } from '../trezorConnectLike';
import { SUBPROCESS_TYPE } from '../types';

describe('createConnectService.getAddress', () => {
    it('passes callId into TrezorConnect.getAddress and yields a flow-complete subprocess', async () => {
        const mock = createTrezorConnectMock();
        const service = createConnectService({ trezorConnect: mock });

        const proc = service.getAddress({
            devicePath: 'p1',
            path: "m/44'/0'/0'/0/0",
            coin: 'btc',
            showOnTrezor: true,
        });
        const iter = proc.run();

        const stepP = iter.next();

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

        const first = await stepP;
        expect(first.value.type).toBe(SUBPROCESS_TYPE.COMPLETE);
        expect(first.value.callId).toBe(proc.callId);
        if (first.value.type === SUBPROCESS_TYPE.COMPLETE) {
            expect(first.value.result.address).toBe('bc1qxyz');
        }

        const next = await iter.next();
        expect(next.done).toBe(true);
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

        const p2 = iter.next();
        mock.resolveGetAddress({
            address: 'bc1qabc',
            path: [44, 0, 0, 0, 0],
            serializedPath: "m/44'/0'/0'/0/0",
        });
        const s2 = await p2;
        expect(s2.value.type).toBe(SUBPROCESS_TYPE.COMPLETE);
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
