import type { VerifiedNonce, VerifiedNonceRequest } from '@suite/desktop-app-api';
import { mockVerifiedNonceEvidence } from '@suite/desktop-app-api/mocks';
import { type Deferred, createDeferred } from '@trezor/utils';

import {
    type VerifiedNonceControllerDeps,
    type VerifierWorker,
    createVerifiedNonceController,
} from './verified-nonce-controller';

const request: VerifiedNonceRequest = {
    requestId: 'req-1',
    chainId: '1',
    address: '0xd2674dA94285660c9b2353131bef2d8211369A4B',
};

const envelope = (overrides: Partial<VerifiedNonce> = {}): VerifiedNonce => ({
    status: 'verified',
    requestId: 'req-1',
    chainId: '1',
    address: request.address.toLowerCase(),
    nonce: '309747',
    block: {
        hash: `0x${'ab'.repeat(32)}`,
        number: '22196327',
        timestampSeconds: '1743779015',
        status: 'authenticated-recent',
    },
    verifiedAtMs: 1743779020000,
    expiresAtMs: 1743779075000,
    verifier: { location: 'desktop', runtime: 'native', revision: '3.0.0', trustPolicyId: 'p' },
    evidence: mockVerifiedNonceEvidence(),
    ...overrides,
});

// The worker starts asynchronously; this lets the start settle before asserting on it.
const flush = () => new Promise<void>(resolve => setImmediate(resolve));

type MockWorker = VerifierWorker & {
    verifyCalls: VerifiedNonceRequest[];
    cancelCalls: string[];
    exit: () => void;
    isDisposed: boolean;
};

const createMockWorker = (
    respond: (request: VerifiedNonceRequest) => Promise<unknown>,
): MockWorker => {
    const exitListeners: (() => void)[] = [];
    const worker: MockWorker = {
        verifyCalls: [],
        cancelCalls: [],
        isDisposed: false,
        verify: verifyRequest => {
            worker.verifyCalls.push(verifyRequest);

            return respond(verifyRequest);
        },
        getInfo: () =>
            Promise.resolve({
                isAvailable: true,
                runtime: 'native',
                revision: '3.0.0',
                trustPolicyId: 'p',
                unavailableCode: null,
            }),
        cancel: requestId => {
            worker.cancelCalls.push(requestId);

            return Promise.resolve(true);
        },
        dispose: () => {
            worker.isDisposed = true;
            exitListeners.forEach(listener => listener());
        },
        watchExit: listener => {
            exitListeners.push(listener);
        },
        exit: () => exitListeners.forEach(listener => listener()),
    };

    return worker;
};

const neverResolves = () => new Promise<unknown>(() => undefined);

const createController = (worker: MockWorker, cancelGraceMs = 20) => {
    const deps: VerifiedNonceControllerDeps = {
        startWorker: () => Promise.resolve(worker),
        logger: { warn: () => undefined },
        cancelGraceMs,
    };

    return createVerifiedNonceController(deps);
};

describe('createVerifiedNonceController', () => {
    it('passes a well-formed envelope for the exact request through', async () => {
        const worker = createMockWorker(() => Promise.resolve(envelope()));
        const controller = createController(worker);

        expect(await controller.verify(request)).toEqual(envelope());
    });

    it('never lets an envelope for another request, chain or address reach the caller', async () => {
        const otherRequest = createMockWorker(() =>
            Promise.resolve(envelope({ requestId: 'req-9' })),
        );
        expect(await createController(otherRequest).verify(request)).toEqual({
            status: 'failed',
            requestId: 'req-1',
            code: 'VERIFICATION_FAILED',
            retryable: false,
        });

        const otherAddress = createMockWorker(() =>
            Promise.resolve(envelope({ address: `0x${'11'.repeat(20)}` })),
        );
        expect(await createController(otherAddress).verify(request)).toMatchObject({
            code: 'VERIFICATION_FAILED',
        });

        const garbage = createMockWorker(() => Promise.resolve({ status: 'verified', nonce: 12 }));
        expect(await createController(garbage).verify(request)).toMatchObject({
            code: 'VERIFICATION_FAILED',
        });

        // Without the evidence block the claim cannot be checked by anyone, so it is not passed on.
        const withoutEvidence = createMockWorker(() =>
            Promise.resolve({ ...envelope(), evidence: undefined }),
        );
        expect(await createController(withoutEvidence).verify(request)).toMatchObject({
            code: 'VERIFICATION_FAILED',
        });
    });

    it('rejects malformed requests without touching the worker', async () => {
        const worker = createMockWorker(() => Promise.resolve(envelope()));
        const controller = createController(worker);

        expect(await controller.verify({ ...request, address: 'nope' })).toMatchObject({
            code: 'INVALID_REQUEST',
        });
        expect(await controller.verify({ ...request, chainId: '5' })).toMatchObject({
            code: 'UNSUPPORTED_CHAIN',
        });
        expect(await controller.verify(null)).toMatchObject({ code: 'INVALID_REQUEST' });
        expect(worker.verifyCalls).toHaveLength(0);
    });

    it('shares one running job between duplicate requests for the same account', async () => {
        const gate = createDeferred<VerifiedNonce>();
        const worker = createMockWorker(() => gate.promise);
        const controller = createController(worker);

        const first = controller.verify(request);
        const second = controller.verify({ ...request, requestId: 'req-2' });
        await flush();
        gate.resolve(envelope());

        expect(await first).toMatchObject({ status: 'verified', requestId: 'req-1' });
        expect(await second).toMatchObject({ status: 'verified', requestId: 'req-2' });
        expect(worker.verifyCalls).toHaveLength(1);
    });

    it('keeps one job queued and cancels an older queued job when a newer one arrives', async () => {
        const gates = new Map<string, Deferred<VerifiedNonce>>();
        const worker = createMockWorker(verifyRequest => {
            const gate = createDeferred<VerifiedNonce>();
            gates.set(verifyRequest.requestId, gate);

            return gate.promise;
        });
        const controller = createController(worker);
        const other = (requestId: string, suffix: string) => ({
            ...request,
            requestId,
            address: `0x${suffix.repeat(20)}`,
        });

        const first = controller.verify(request);
        const second = controller.verify(other('req-2', '22'));
        const third = controller.verify(other('req-3', '33'));
        await flush();

        expect(await second).toMatchObject({ code: 'CANCELLED' });
        expect(worker.verifyCalls.map(call => call.requestId)).toEqual(['req-1']);
        gates.get('req-1')!.resolve(envelope());
        expect(await first).toMatchObject({ status: 'verified' });
        await flush();
        expect(worker.verifyCalls.map(call => call.requestId)).toEqual(['req-1', 'req-3']);
        gates
            .get('req-3')!
            .resolve(envelope({ requestId: 'req-3', address: `0x${'33'.repeat(20)}` }));
        expect(await third).toMatchObject({ status: 'verified', requestId: 'req-3' });
    });

    it('cancels the active job and kills the worker if it does not stop in time', async () => {
        const worker = createMockWorker(neverResolves);
        const controller = createController(worker, 10);

        const pending = controller.verify(request);
        await flush();
        await controller.cancel('req-1');

        expect(worker.cancelCalls).toEqual(['req-1']);
        expect(worker.isDisposed).toBe(true);
        expect(await pending).toEqual({
            status: 'failed',
            requestId: 'req-1',
            code: 'CANCELLED',
            retryable: false,
        });
    });

    it('cancels a queued job without involving the worker', async () => {
        const worker = createMockWorker(neverResolves);
        const controller = createController(worker);

        controller.verify(request);
        const queued = controller.verify({
            ...request,
            requestId: 'req-2',
            address: `0x${'22'.repeat(20)}`,
        });
        await controller.cancel('req-2');

        expect(await queued).toMatchObject({ code: 'CANCELLED' });
        expect(worker.cancelCalls).toEqual([]);
    });

    it('reports a crashed worker and starts a fresh one for the next job', async () => {
        let started = 0;
        const first = createMockWorker(neverResolves);
        const second = createMockWorker(() => Promise.resolve(envelope({ requestId: 'req-2' })));
        const deps: VerifiedNonceControllerDeps = {
            startWorker: () => Promise.resolve(started++ === 0 ? first : second),
            logger: { warn: () => undefined },
        };
        const controller = createVerifiedNonceController(deps);

        const pending = controller.verify(request);
        await flush();
        first.exit();

        expect(await pending).toMatchObject({ code: 'WORKER_CRASHED', retryable: true });
        expect(await controller.verify({ ...request, requestId: 'req-2' })).toMatchObject({
            status: 'verified',
            requestId: 'req-2',
        });
        expect(started).toBe(2);
    });

    it('reports the native runtime as unavailable when the worker cannot start', async () => {
        const deps: VerifiedNonceControllerDeps = {
            startWorker: () => Promise.reject(new Error('spawn failed')),
            logger: { warn: () => undefined },
        };
        const controller = createVerifiedNonceController(deps);

        expect(await controller.verify(request)).toMatchObject({ code: 'NATIVE_UNAVAILABLE' });
        expect(await controller.getInfo()).toMatchObject({
            isAvailable: false,
            unavailableCode: 'NATIVE_UNAVAILABLE',
        });
    });

    it('settles everything as cancelled on dispose', async () => {
        const worker = createMockWorker(neverResolves);
        const controller = createController(worker);

        const pending = controller.verify(request);
        await flush();
        controller.dispose();

        expect(await pending).toMatchObject({ code: 'CANCELLED' });
        expect(worker.isDisposed).toBe(true);
    });
});
