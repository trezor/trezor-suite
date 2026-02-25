import { UI } from '../../events';
import { DeviceUniquePath } from '../../types/device';
import { createUiPromiseManager } from '../uiPromiseManager';

const createMockDevice = (path: string) =>
    ({
        getUniquePath: () => path as DeviceUniquePath,
    }) as any;

describe('uiPromiseManager', () => {
    it('creates and resolves a UI promise by type and device path', async () => {
        const manager = createUiPromiseManager();
        const device = createMockDevice('device-path-1');

        const uiPromise = manager.create(UI.RECEIVE_PIN, device);

        const resolved = manager.resolve({
            type: UI.RECEIVE_PIN,
            payload: '1234',
            device: { path: 'device-path-1' as DeviceUniquePath },
        });

        expect(resolved).toBe(true);
        await expect(uiPromise.promise).resolves.toEqual(
            expect.objectContaining({
                type: UI.RECEIVE_PIN,
                payload: '1234',
            }),
        );
    });

    it('returns false when resolving a non-existent promise', () => {
        const manager = createUiPromiseManager();

        const resolved = manager.resolve({
            type: UI.RECEIVE_PIN,
            payload: '1234',
        });

        expect(resolved).toBe(false);
    });

    it('stores device reference on the created promise', () => {
        const manager = createUiPromiseManager();
        const device = createMockDevice('device-path-1');

        const uiPromise = manager.create(UI.RECEIVE_PIN, device);

        expect(uiPromise.device).toBe(device);
    });

    it('checks existence of a promise by type', () => {
        const manager = createUiPromiseManager();
        const device = createMockDevice('device-path-1');

        expect(manager.exists(UI.RECEIVE_PIN)).toBe(false);

        manager.create(UI.RECEIVE_PIN, device);

        expect(manager.exists(UI.RECEIVE_PIN)).toBe(true);
    });

    it('replaces an existing promise of the same type and device', async () => {
        const manager = createUiPromiseManager();
        const device = createMockDevice('device-path-1');

        const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

        const first = manager.create(UI.RECEIVE_PIN, device);
        const second = manager.create(UI.RECEIVE_PIN, device);

        expect(warnSpy).toHaveBeenCalledWith("UiPromise 'ui-receive_pin' already exists.");
        warnSpy.mockRestore();

        // First promise should have been removed, second should resolve.
        manager.resolve({
            type: UI.RECEIVE_PIN,
            payload: 'new-pin',
            device: { path: 'device-path-1' as DeviceUniquePath },
        });

        await expect(second.promise).resolves.toEqual(
            expect.objectContaining({
                type: UI.RECEIVE_PIN,
                payload: 'new-pin',
            }),
        );

        // The first was dropped so it won't resolve — check it's not the same object.
        expect(first).not.toBe(second);
    });

    it('resolves different promise types independently', async () => {
        const manager = createUiPromiseManager();
        const device = createMockDevice('device-path-1');

        const pinPromise = manager.create(UI.RECEIVE_PIN, device);
        const wordPromise = manager.create(UI.RECEIVE_WORD, device);

        manager.resolve({
            type: UI.RECEIVE_PIN,
            payload: '5678',
            device: { path: 'device-path-1' as DeviceUniquePath },
        });

        await expect(pinPromise.promise).resolves.toEqual(
            expect.objectContaining({
                type: UI.RECEIVE_PIN,
                payload: '5678',
            }),
        );

        // Word promise should still be pending.
        expect(manager.exists(UI.RECEIVE_WORD)).toBe(true);

        manager.resolve({
            type: UI.RECEIVE_WORD,
            payload: 'abandon',
            device: { path: 'device-path-1' as DeviceUniquePath },
        });

        await expect(wordPromise.promise).resolves.toEqual(
            expect.objectContaining({
                type: UI.RECEIVE_WORD,
                payload: 'abandon',
            }),
        );
    });

    it('resolve removes the promise from internal list', () => {
        const manager = createUiPromiseManager();
        const device = createMockDevice('device-path-1');

        manager.create(UI.RECEIVE_PIN, device);
        expect(manager.exists(UI.RECEIVE_PIN)).toBe(true);

        manager.resolve({
            type: UI.RECEIVE_PIN,
            payload: '1234',
            device: { path: 'device-path-1' as DeviceUniquePath },
        });

        expect(manager.exists(UI.RECEIVE_PIN)).toBe(false);
    });

    it('rejectAll rejects all pending promises', async () => {
        const manager = createUiPromiseManager();
        const device = createMockDevice('device-path-1');

        const pinPromise = manager.create(UI.RECEIVE_PIN, device);
        const wordPromise = manager.create(UI.RECEIVE_WORD, device);

        manager.rejectAll(new Error('Session closed'));

        await expect(pinPromise.promise).rejects.toThrow('Session closed');
        await expect(wordPromise.promise).rejects.toThrow('Session closed');
    });

    describe('device-targeted resolution', () => {
        it('resolves the correct device when response includes device path', async () => {
            const manager = createUiPromiseManager();
            const deviceA = createMockDevice('path-A');
            const deviceB = createMockDevice('path-B');

            const promiseA = manager.create(UI.RECEIVE_PIN, deviceA);
            const promiseB = manager.create(UI.RECEIVE_PIN, deviceB);

            // Resolve for device B specifically.
            manager.resolve({
                type: UI.RECEIVE_PIN,
                payload: 'pin-for-B',
                device: { path: 'path-B' as DeviceUniquePath },
            });

            await expect(promiseB.promise).resolves.toEqual(
                expect.objectContaining({
                    type: UI.RECEIVE_PIN,
                    payload: 'pin-for-B',
                }),
            );

            // Promise A should still be pending.
            expect(manager.exists(UI.RECEIVE_PIN)).toBe(true);

            // Now resolve for device A.
            manager.resolve({
                type: UI.RECEIVE_PIN,
                payload: 'pin-for-A',
                device: { path: 'path-A' as DeviceUniquePath },
            });

            await expect(promiseA.promise).resolves.toEqual(
                expect.objectContaining({
                    type: UI.RECEIVE_PIN,
                    payload: 'pin-for-A',
                }),
            );
        });

        it('does not resolve a promise when device path does not match', () => {
            const manager = createUiPromiseManager();
            const device = createMockDevice('path-A');

            manager.create(UI.RECEIVE_PIN, device);

            const resolved = manager.resolve({
                type: UI.RECEIVE_PIN,
                payload: '1234',
                device: { path: 'path-B' as DeviceUniquePath },
            });

            // No promise for path-B exists, so resolve should return false.
            expect(resolved).toBe(false);
            // Original promise for path-A should still be pending.
            expect(manager.exists(UI.RECEIVE_PIN)).toBe(true);
        });

        it('matches promise without device only when response also has no device', async () => {
            const manager = createUiPromiseManager();

            // Create promise without device.
            const uiPromise = manager.create(UI.RECEIVE_PIN);

            // Response without device should match.
            manager.resolve({
                type: UI.RECEIVE_PIN,
                payload: '1234',
            });

            await expect(uiPromise.promise).resolves.toEqual({
                type: UI.RECEIVE_PIN,
                payload: '1234',
            });
        });

        it('does not resolve deviceless promise when response has device path', () => {
            const manager = createUiPromiseManager();

            // Create promise without device.
            manager.create(UI.RECEIVE_PIN);

            // Response WITH device path should not match a deviceless promise.
            const resolved = manager.resolve({
                type: UI.RECEIVE_PIN,
                payload: '1234',
                device: { path: 'path-A' as DeviceUniquePath },
            });

            expect(resolved).toBe(false);
            expect(manager.exists(UI.RECEIVE_PIN)).toBe(true);
        });

        it('does not resolve device promise when response has no device path', () => {
            const manager = createUiPromiseManager();
            const device = createMockDevice('path-A');

            manager.create(UI.RECEIVE_PIN, device);

            // Response without device should not match a promise that has a device.
            const resolved = manager.resolve({
                type: UI.RECEIVE_PIN,
                payload: '1234',
            });

            expect(resolved).toBe(false);
            expect(manager.exists(UI.RECEIVE_PIN)).toBe(true);
        });

        it('create scopes duplicate replacement to same device', () => {
            const manager = createUiPromiseManager();
            const deviceA = createMockDevice('path-A');
            const deviceB = createMockDevice('path-B');

            const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

            // Create PIN promise for device A.
            manager.create(UI.RECEIVE_PIN, deviceA);
            // Create PIN promise for device B — this should NOT replace A's promise.
            manager.create(UI.RECEIVE_PIN, deviceB);

            // No warning because the promises are for different devices.
            expect(warnSpy).not.toHaveBeenCalled();

            // Creating another for device A SHOULD warn and replace.
            manager.create(UI.RECEIVE_PIN, deviceA);
            expect(warnSpy).toHaveBeenCalledWith("UiPromise 'ui-receive_pin' already exists.");

            warnSpy.mockRestore();
        });
    });

    describe('disconnected', () => {
        it('resolves DISCONNECT promise for the matching device path', () => {
            const manager = createUiPromiseManager();
            const device = createMockDevice('device-path-1');

            manager.create('device-disconnect', device);

            const result = manager.disconnected('device-path-1' as any);
            expect(result).toBe(true);
        });

        it('does not resolve DISCONNECT promise for a different device path', () => {
            const manager = createUiPromiseManager();
            const device = createMockDevice('device-path-1');

            manager.create('device-disconnect', device);

            const result = manager.disconnected('device-path-2' as any);
            // Returns true because there is still a promise associated with a device (even if not matched for disconnect).
            // The check is: toResolve.length > 0 || toKeep has some matching device.
            expect(result).toBe(false);
        });

        it('returns true when non-disconnect promises exist for the device path', () => {
            const manager = createUiPromiseManager();
            const device = createMockDevice('device-path-1');

            manager.create(UI.RECEIVE_PIN, device);

            const result = manager.disconnected('device-path-1' as any);

            // No DISCONNECT promise was resolved, but there is a PIN promise for this device.
            expect(result).toBe(true);
        });

        it('returns false when no promises exist for the device path', () => {
            const manager = createUiPromiseManager();
            const device = createMockDevice('device-path-other');

            manager.create(UI.RECEIVE_PIN, device);

            const result = manager.disconnected('device-path-1' as any);
            expect(result).toBe(false);
        });
    });

    it('reject via promise.reject removes it from list', async () => {
        const manager = createUiPromiseManager();
        const device = createMockDevice('device-path-1');

        const uiPromise = manager.create(UI.RECEIVE_PIN, device);

        // Catch the rejection to avoid unhandled promise rejection.
        const rejection = uiPromise.promise.catch(e => e);

        uiPromise.reject(new Error('cancelled'));

        expect(manager.exists(UI.RECEIVE_PIN)).toBe(false);
        await expect(rejection).resolves.toThrow('cancelled');
    });

    it('clear removes all promises without resolving or rejecting', () => {
        const manager = createUiPromiseManager();
        const device = createMockDevice('device-path-1');

        manager.create(UI.RECEIVE_PIN, device);
        manager.create(UI.RECEIVE_WORD, device);

        manager.clear();

        expect(manager.exists(UI.RECEIVE_PIN)).toBe(false);
        expect(manager.exists(UI.RECEIVE_WORD)).toBe(false);
    });

    it('get returns the promise for an existing type', async () => {
        const manager = createUiPromiseManager();
        const device = createMockDevice('device-path-1');

        manager.create(UI.RECEIVE_PIN, device);

        const promise = manager.get(UI.RECEIVE_PIN);

        manager.resolve({
            type: UI.RECEIVE_PIN,
            payload: '9999',
            device: { path: 'device-path-1' as DeviceUniquePath },
        });

        await expect(promise).resolves.toEqual(
            expect.objectContaining({
                type: UI.RECEIVE_PIN,
                payload: '9999',
            }),
        );
    });

    it('get rejects for a non-existent type', async () => {
        const manager = createUiPromiseManager();

        await expect(manager.get(UI.RECEIVE_PIN)).rejects.toThrow(
            "UiPromise ui-receive_pin doesn't exist",
        );
    });
});
