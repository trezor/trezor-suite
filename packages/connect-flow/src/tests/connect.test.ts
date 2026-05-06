import { createConnect } from '../connect';
import { createTrezorConnectMock } from '../mock';

describe('createConnect', () => {
    it('passes injected callId into the wrapped method and yields a complete subprocess', async () => {
        const mock = createTrezorConnectMock();
        const connect = createConnect({ trezorConnect: mock });

        const getAddress = connect(mock.getAddress);
        const proc = getAddress({
            device: { path: 'p1' },
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
                callId: proc.id,
            },
        ]);

        mock.resolveGetAddress({
            address: 'bc1qxyz',
            path: [44, 0, 0, 0, 0],
            serializedPath: "m/44'/0'/0'/0/0",
        });

        const first = await stepP;
        expect(first.value.type).toBe('complete');
        expect(first.value.callId).toBe(proc.id);
        if (first.value.type === 'complete') {
            expect(first.value.result.address).toBe('bc1qxyz');
        }

        const next = await iter.next();
        expect(next.done).toBe(true);
    });

    it('yields a ui-request_pin subprocess and forwards .send() as a UiResponse', async () => {
        const mock = createTrezorConnectMock();
        const connect = createConnect({ trezorConnect: mock });

        const getAddress = connect(mock.getAddress);
        const proc = getAddress({ path: "m/44'/0'/0'/0/0" });
        const iter = proc.run();

        const p1 = iter.next();
        mock.emit({
            type: 'ui-request_pin',
            payload: { device: { path: 'p1' }, type: 'Current' },
            callId: proc.id,
            requestId: 'req-1',
        });
        const s1 = await p1;
        expect(s1.value.type).toBe('ui-request_pin');
        if (s1.value.type === 'ui-request_pin') {
            // payload comes straight through from the emitted UiEvent
            expect(s1.value.payload.device.path).toBe('p1');
            s1.value.send('1234');
        }

        expect(mock.uiResponses).toEqual([
            { type: 'ui-receive_pin', payload: { value: '1234' }, requestId: 'req-1' },
        ]);

        // Resolve the underlying call so the iterator finishes.
        const p2 = iter.next();
        mock.resolveGetAddress({
            address: 'bc1qabc',
            path: [44, 0, 0, 0, 0],
            serializedPath: "m/44'/0'/0'/0/0",
        });
        const s2 = await p2;
        expect(s2.value.type).toBe('complete');
    });

    it('toPromise() resolves with the wrapped method payload', async () => {
        const mock = createTrezorConnectMock();
        const connect = createConnect({ trezorConnect: mock });

        const getAddress = connect(mock.getAddress);
        const proc = getAddress({ path: "m/44'/0'/0'/0/0" });
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

    it('ignores UI events emitted with a different callId', async () => {
        const mock = createTrezorConnectMock();
        const connect = createConnect({ trezorConnect: mock });

        const getAddress = connect(mock.getAddress);
        const proc = getAddress({ path: "m/44'/0'/0'/0/0" });
        const iter = proc.run();

        const pending = iter.next();
        mock.emit({
            type: 'ui-request_pin',
            payload: { device: { path: 'p1' }, type: 'Current' },
            callId: 'some-other-call',
            requestId: 'noise',
        });

        // The unrelated event must not surface; resolving the call should produce 'complete' next.
        mock.resolveGetAddress({
            address: 'bc1qfilter',
            path: [44, 0, 0, 0, 0],
            serializedPath: "m/44'/0'/0'/0/0",
        });

        const next = await pending;
        expect(next.value.type).toBe('complete');
    });
});
