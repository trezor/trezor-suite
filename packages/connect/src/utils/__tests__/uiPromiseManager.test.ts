import { UI_RESPONSE } from '@trezor/connect-common';

import { createUiPromiseManager } from '../uiPromiseManager';

const createMockDevice = (path: string) =>
    ({
        getUniquePath: () => path,
    }) as any;

describe('utils/uiPromiseManager', () => {
    describe('resolve', () => {
        it('resolves a promise by type for backward compatibility', async () => {
            const manager = createUiPromiseManager();
            const promise = manager.create(UI_RESPONSE.RECEIVE_PIN);

            manager.resolve({ type: UI_RESPONSE.RECEIVE_PIN, payload: '1234' });

            const result = await promise.promise;
            expect(result.payload).toBe('1234');
        });

        it('resolves the correct promise when requestId matches', async () => {
            const manager = createUiPromiseManager();
            // promise1
            manager.create(UI_RESPONSE.RECEIVE_PIN, createMockDevice('path-1'));
            // promise2
            const promise2 = manager.create(UI_RESPONSE.RECEIVE_PIN, createMockDevice('path-2'));

            manager.resolve({
                type: UI_RESPONSE.RECEIVE_PIN,
                payload: 'pin-for-device-2',
                requestId: promise2.requestId,
            });

            const result = await promise2.promise;
            expect(result.payload).toBe('pin-for-device-2');

            // promise1 should still be pending
            expect(manager.exists(UI_RESPONSE.RECEIVE_PIN)).toBe(true);
        });

        it('does not resolve a promise when requestId does not match', () => {
            const manager = createUiPromiseManager();
            manager.create(UI_RESPONSE.RECEIVE_PIN, createMockDevice('path-1'));

            const resolved = manager.resolve({
                type: UI_RESPONSE.RECEIVE_PIN,
                payload: 'wrong',
                requestId: 'non-existent-id',
            });

            expect(resolved).toBe(false);
            expect(manager.exists(UI_RESPONSE.RECEIVE_PIN)).toBe(true);
        });

        it('falls back to type-only matching when response has no requestId for backward compatibility', async () => {
            const manager = createUiPromiseManager();
            const promise = manager.create(UI_RESPONSE.RECEIVE_PIN, createMockDevice('path-1'));

            manager.resolve({ type: UI_RESPONSE.RECEIVE_PIN, payload: 'fallback-pin' });

            const result = await promise.promise;
            expect(result.payload).toBe('fallback-pin');
        });

        it('each promise gets a unique requestId', () => {
            const manager = createUiPromiseManager();
            const p1 = manager.create(UI_RESPONSE.RECEIVE_PIN);
            const p2 = manager.create(UI_RESPONSE.RECEIVE_PASSPHRASE);
            const p3 = manager.create(UI_RESPONSE.RECEIVE_WORD);

            expect(p1.requestId).not.toBe(p2.requestId);
            expect(p2.requestId).not.toBe(p3.requestId);
            expect(p1.requestId).not.toBe(p3.requestId);
        });
    });
});
