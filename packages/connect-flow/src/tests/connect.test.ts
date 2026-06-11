import { createConnect } from '../connect';
import { createTrezorConnectMock } from '../mock';

describe('createConnect', () => {
    it('passes injected callId into the wrapped method and resolves toPromise', async () => {
        const mock = createTrezorConnectMock();
        const connect = createConnect({ trezorConnect: mock });

        const getAddress = connect(mock.getAddress);
        const proc = getAddress({
            device: { path: 'p1' },
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
                callId: proc.id,
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
            { type: 'ui-receive_pin', payload: '1234', requestId: 'req-1' },
        ]);

        // Resolving the underlying call ends the stream; the result is on toPromise().
        mock.resolveGetAddress({
            address: 'bc1qabc',
            path: [44, 0, 0, 0, 0],
            serializedPath: "m/44'/0'/0'/0/0",
        });
        const next = await iter.next();
        expect(next.done).toBe(true);
        await expect(proc.toPromise()).resolves.toMatchObject({ address: 'bc1qabc' });
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

        // The unrelated event must not surface; resolving the call ends the stream.
        mock.resolveGetAddress({
            address: 'bc1qfilter',
            path: [44, 0, 0, 0, 0],
            serializedPath: "m/44'/0'/0'/0/0",
        });

        const next = await pending;
        expect(next.done).toBe(true);
        await expect(proc.toPromise()).resolves.toMatchObject({ address: 'bc1qfilter' });
    });
});
