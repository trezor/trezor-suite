import { createConnectService } from '../createConnectService';
import { createTrezorConnectMock } from '../mock';
import { UI_REQUEST } from '../trezorConnectLike';
import { SUBPROCESS_TYPE } from '../types';
import type {
    CompleteSubProcess,
    ErrorSubProcess,
    RequestPassphraseSubProcess,
    RequestPinSubProcess,
    ResultOf,
    WalletResult,
    WalletSubProcess,
} from '../types';

// Compile-time only — IsExact is `true` iff A and B are structurally equal.
type IsExact<A, B> =
    (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
        ? (<T>() => T extends B ? 1 : 2) extends <T>() => T extends A ? 1 : 2
            ? true
            : false
        : false;
const assertType = <_T extends true>() => undefined;

describe('createConnectService.createWallet', () => {
    it('runs a no-passphrase wallet to completion, with callId+cancel on every subprocess', async () => {
        const mock = createTrezorConnectMock();
        const service = createConnectService({ trezorConnect: mock });

        const proc = service.createWallet({ devicePath: 'p1', usePassphrase: false });
        const iter = proc.run();

        const firstStepP = iter.next();

        expect(mock.getDeviceStateCalls).toEqual([
            {
                device: { path: 'p1' },
                useEmptyPassphrase: true,
                callId: proc.callId,
            },
        ]);

        mock.resolveGetDeviceState({ state: '0xstate' });

        const first = await firstStepP;
        expect(first.value.type).toBe(SUBPROCESS_TYPE.COMPLETE);
        expect(first.value.callId).toBe(proc.callId);
        expect(typeof first.value.cancel).toBe('function');
        if (first.value.type === SUBPROCESS_TYPE.COMPLETE) {
            expect(first.value.result).toEqual({ deviceState: '0xstate' });
        }

        const next = await iter.next();
        expect(next.done).toBe(true);
    });

    it('drives a passphrase flow: prompt -> send -> complete', async () => {
        const mock = createTrezorConnectMock();
        const service = createConnectService({ trezorConnect: mock });

        const proc = service.createWallet({ devicePath: 'p1', usePassphrase: true });
        const iter = proc.run();

        const firstStepP = iter.next();
        mock.emit({
            type: 'ui-request_passphrase',
            payload: { device: { path: 'p1' } },
            requestId: 'req-1',
            callId: proc.callId,
        });

        const first = await firstStepP;
        expect(first.value.type).toBe(SUBPROCESS_TYPE.REQUEST_PASSPHRASE);
        expect(first.value.callId).toBe(proc.callId);
        if (first.value.type !== SUBPROCESS_TYPE.REQUEST_PASSPHRASE) {
            throw new Error('unreachable');
        }

        first.value.send('hunter2', { save: true });
        expect(mock.uiResponses).toEqual([
            {
                type: 'ui-receive_passphrase',
                payload: { value: 'hunter2', save: true, passphraseOnDevice: false },
                requestId: 'req-1',
            },
        ]);

        const secondP = iter.next();
        mock.resolveGetDeviceState({ state: '0xhidden' });
        const second = await secondP;
        expect(second.value.type).toBe(SUBPROCESS_TYPE.COMPLETE);
        if (second.value.type === SUBPROCESS_TYPE.COMPLETE) {
            expect(second.value.result).toEqual({ deviceState: '0xhidden' });
        }
    });

    it('yields request_button (with code) and request_passphrase_on_device subprocesses', async () => {
        const mock = createTrezorConnectMock();
        const service = createConnectService({ trezorConnect: mock });

        const proc = service.createWallet({ devicePath: 'p1', usePassphrase: true });
        const iter = proc.run();

        const p1 = iter.next();
        mock.emit({
            type: 'ui-button',
            payload: { device: { path: 'p1' }, code: 'ButtonRequest_ProtectCall' },
            callId: proc.callId,
        });
        const s1 = await p1;
        expect(s1.value.type).toBe(UI_REQUEST.REQUEST_BUTTON);
        if (s1.value.type === UI_REQUEST.REQUEST_BUTTON) {
            expect(s1.value.payload.code).toBe('ButtonRequest_ProtectCall');
        }
        expect(s1.value.callId).toBe(proc.callId);

        const p2 = iter.next();
        mock.emit({
            type: 'ui-request_passphrase_on_device',
            payload: { device: { path: 'p1' } },
            callId: proc.callId,
        });
        const s2 = await p2;
        expect(s2.value.type).toBe(UI_REQUEST.REQUEST_PASSPHRASE_ON_DEVICE);
        expect(s2.value.callId).toBe(proc.callId);

        const p3 = iter.next();
        mock.resolveGetDeviceState({ state: '0xdone' });
        const s3 = await p3;
        expect(s3.value.type).toBe(SUBPROCESS_TYPE.COMPLETE);
    });

    it('subprocess.cancel() ends the run for the same callId', async () => {
        const mock = createTrezorConnectMock();
        const service = createConnectService({ trezorConnect: mock });

        const proc = service.createWallet({ devicePath: 'p1', usePassphrase: true });
        const iter = proc.run();

        const subprocessP = iter.next();
        mock.emit({
            type: 'ui-request_passphrase',
            payload: { device: { path: 'p1' } },
            requestId: 'r1',
            callId: proc.callId,
        });
        const subprocess = await subprocessP;
        expect(subprocess.value.callId).toBe(proc.callId);

        subprocess.value.cancel();

        const next = await iter.next();
        expect(next.done).toBe(true);
    });

    it('ignores events tagged with a different callId', async () => {
        const mock = createTrezorConnectMock();
        const service = createConnectService({ trezorConnect: mock });

        const proc = service.createWallet({ devicePath: 'p1', usePassphrase: false });
        const iter = proc.run();

        const subprocessP = iter.next();
        // Foreign callId: must be filtered out — would otherwise corrupt the flow
        mock.emit({
            type: 'ui-button',
            payload: { device: { path: 'p1' }, code: 'x' },
            callId: 'some-other-call',
        });
        mock.resolveGetDeviceState({ state: '0x1' });

        const subprocess = await subprocessP;
        expect(subprocess.value.type).toBe(SUBPROCESS_TYPE.COMPLETE);
    });

    it('yields flow-error when the underlying call fails', async () => {
        const mock = createTrezorConnectMock();
        const service = createConnectService({ trezorConnect: mock });

        const proc = service.createWallet({ devicePath: 'p1', usePassphrase: false });
        const iter = proc.run();

        const subprocessP = iter.next();
        mock.rejectGetDeviceState('Device disconnected');
        const subprocess = await subprocessP;

        expect(subprocess.value.type).toBe(SUBPROCESS_TYPE.ERROR);
        expect(subprocess.value.callId).toBe(proc.callId);
        if (subprocess.value.type !== SUBPROCESS_TYPE.ERROR) throw new Error('unreachable');
        expect(subprocess.value.error.message).toBe('Device disconnected');

        const next = await iter.next();
        expect(next.done).toBe(true);
    });

    it('refuses concurrent processes', () => {
        const mock = createTrezorConnectMock();
        const service = createConnectService({ trezorConnect: mock });

        service.createWallet({ devicePath: 'p1', usePassphrase: false });
        expect(() => service.createWallet({ devicePath: 'p1', usePassphrase: false })).toThrow(
            /already running/,
        );
    });

    it('allows a new process after the previous one completes (different callIds)', async () => {
        const mock = createTrezorConnectMock();
        const service = createConnectService({ trezorConnect: mock });

        const proc1 = service.createWallet({ devicePath: 'p1', usePassphrase: false });
        const iter1 = proc1.run();
        const p = iter1.next();
        mock.resolveGetDeviceState({ state: '0x1' });
        await p;
        await iter1.next();

        const proc2 = service.createWallet({ devicePath: 'p1', usePassphrase: false });
        expect(proc2.callId).not.toBe(proc1.callId);
    });

    it('proc.cancel() cleans up and ends iteration', async () => {
        const mock = createTrezorConnectMock();
        const service = createConnectService({ trezorConnect: mock });

        const proc = service.createWallet({ devicePath: 'p1', usePassphrase: true });
        const iter = proc.run();

        const subprocessP = iter.next();
        mock.emit({
            type: 'ui-request_passphrase',
            payload: { device: { path: 'p1' } },
            requestId: 'r1',
            callId: proc.callId,
        });
        const subprocess = await subprocessP;
        expect(subprocess.value.type).toBe(SUBPROCESS_TYPE.REQUEST_PASSPHRASE);

        proc.cancel();

        const next = await iter.next();
        expect(next.done).toBe(true);
    });

    it('refuses run() being called twice on the same process', () => {
        const mock = createTrezorConnectMock();
        const service = createConnectService({ trezorConnect: mock });

        const proc = service.createWallet({ devicePath: 'p1', usePassphrase: false });
        proc.run();
        expect(() => proc.run()).toThrow(/only be called once/);
    });

    it('toPromise() resolves with the final result on a no-prompt flow', async () => {
        const mock = createTrezorConnectMock();
        const service = createConnectService({ trezorConnect: mock });

        const proc = service.createWallet({ devicePath: 'p1', usePassphrase: false });
        const finalP = proc.toPromise();

        expect(mock.getDeviceStateCalls).toHaveLength(1);
        mock.resolveGetDeviceState({ state: '0xabc' });

        await expect(finalP).resolves.toEqual({ deviceState: '0xabc' });
    });

    it('toPromise() rejects on flow error', async () => {
        const mock = createTrezorConnectMock();
        const service = createConnectService({ trezorConnect: mock });

        const proc = service.createWallet({ devicePath: 'p1', usePassphrase: false });
        const finalP = proc.toPromise();

        mock.rejectGetDeviceState('boom');

        await expect(finalP).rejects.toThrow('boom');
    });

    it('toPromise() rejects when the process is cancelled', async () => {
        const mock = createTrezorConnectMock();
        const service = createConnectService({ trezorConnect: mock });

        const proc = service.createWallet({ devicePath: 'p1', usePassphrase: true });
        const finalP = proc.toPromise();

        proc.cancel();

        await expect(finalP).rejects.toThrow(/cancelled/);
    });

    it('narrows yielded subprocesses via switch on type (discriminated union test)', async () => {
        const mock = createTrezorConnectMock();
        const service = createConnectService({ trezorConnect: mock });

        const proc = service.createWallet({ devicePath: 'p1', usePassphrase: true });

        assertType<IsExact<ResultOf<WalletSubProcess>, WalletResult>>();

        const iter = proc.run();
        type IterElement =
            Awaited<ReturnType<typeof iter.next>> extends IteratorResult<infer V> ? V : never;
        assertType<IsExact<IterElement, WalletSubProcess>>();

        setImmediate(() => {
            mock.emit({
                type: 'ui-button',
                payload: { device: { path: 'p1' }, code: 'BR1' },
                callId: proc.callId,
            });
        });

        const seen: string[] = [];
        for await (const subprocess of iter) {
            switch (subprocess.type) {
                case SUBPROCESS_TYPE.REQUEST_PASSPHRASE: {
                    const _narrow: RequestPassphraseSubProcess = subprocess;
                    void _narrow;

                    subprocess.send('hunter2', { save: false });
                    seen.push('passphrase');
                    setImmediate(() => mock.resolveGetDeviceState({ state: '0xhidden' }));
                    break;
                }
                case UI_REQUEST.REQUEST_PASSPHRASE_ON_DEVICE: {
                    seen.push('passphrase_on_device');
                    break;
                }
                case SUBPROCESS_TYPE.REQUEST_PIN: {
                    subprocess.send('1234');
                    const _narrow: RequestPinSubProcess = subprocess;
                    void _narrow;
                    seen.push('pin');
                    break;
                }
                case UI_REQUEST.REQUEST_BUTTON: {
                    const { code } = subprocess.payload;
                    seen.push(`button:${code}`);
                    setImmediate(() =>
                        mock.emit({
                            type: 'ui-request_passphrase',
                            payload: { device: { path: 'p1' } },
                            requestId: 'r1',
                            callId: proc.callId,
                        }),
                    );
                    break;
                }
                case SUBPROCESS_TYPE.COMPLETE: {
                    const _narrow: CompleteSubProcess<WalletResult> = subprocess;
                    void _narrow;
                    const { result } = subprocess;
                    seen.push(`complete:${result.deviceState}`);
                    break;
                }
                case SUBPROCESS_TYPE.ERROR: {
                    const _narrow: ErrorSubProcess = subprocess;
                    void _narrow;
                    const { error } = subprocess;
                    seen.push(`error:${error.message}`);
                    break;
                }
                default: {
                    // Other non-interactive UI notifications (UiNotificationSubProcess
                    // is an open union) are not asserted by this test.
                    break;
                }
            }
        }

        expect(seen).toEqual(['button:BR1', 'passphrase', 'complete:0xhidden']);
    });

    it('toPromise() and run() can be used together to drive a passphrase flow', async () => {
        const mock = createTrezorConnectMock();
        const service = createConnectService({ trezorConnect: mock });

        const proc = service.createWallet({ devicePath: 'p1', usePassphrase: true });
        const finalP = proc.toPromise();
        const iter = proc.run();

        const subprocessP = iter.next();
        mock.emit({
            type: 'ui-request_passphrase',
            payload: { device: { path: 'p1' } },
            requestId: 'r1',
            callId: proc.callId,
        });
        const subprocess = await subprocessP;
        if (subprocess.value.type !== SUBPROCESS_TYPE.REQUEST_PASSPHRASE) {
            throw new Error('unreachable');
        }
        subprocess.value.send('pw');

        const drain = (async () => {
            for await (const _ of iter) {
                // ignore
            }
        })();
        mock.resolveGetDeviceState({ state: '0xhidden' });

        await expect(finalP).resolves.toEqual({ deviceState: '0xhidden' });
        await drain;
    });
});
