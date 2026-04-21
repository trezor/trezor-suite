import { type AbstractApi } from '@trezor/transport/src/api/abstract';
import * as ERRORS from '@trezor/transport/src/errors';
import { PathInternal, PathPublic, Session } from '@trezor/transport/src/types';

import { createCore } from '../src/core';

const createFakeApi = (override: Partial<AbstractApi> = {}): AbstractApi =>
    ({
        chunkSize: 64,
        enumerate: jest.fn(() =>
            Promise.resolve({
                success: true,
                payload: [{ path: PathInternal('1'), type: 1, product: 0, vendor: 0 }],
            }),
        ),
        openDevice: jest.fn(() => Promise.resolve({ success: true, payload: undefined })),
        closeDevice: jest.fn(() => Promise.resolve({ success: true, payload: undefined })),
        on: jest.fn(),
        off: jest.fn(),
        listen: jest.fn(),
        dispose: jest.fn(),
        ...override,
    }) as unknown as AbstractApi;

const abortSignal = () => new AbortController().signal;

describe('core', () => {
    describe('acquire failure paths', () => {
        it('openDevice failure releases session lock via abort', async () => {
            const api = createFakeApi({
                openDevice: jest.fn(() =>
                    Promise.resolve({
                        success: false,
                        error: { code: ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE },
                    }),
                ),
            });
            const core = createCore(api);
            await core.enumerate({ signal: abortSignal() });

            const first = await core.acquire({
                path: PathPublic('1'),
                previous: 'null',
                signal: abortSignal(),
                sessionOwner: 'test',
            });
            expect(first).toMatchObject({
                success: false,
                error: { code: ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE },
            });

            // Lock was released: a subsequent acquire proceeds (openDevice is called again).
            const second = await core.acquire({
                path: PathPublic('1'),
                previous: 'null',
                signal: abortSignal(),
                sessionOwner: 'test',
            });
            expect(second.success).toBe(false);
            expect(api.openDevice).toHaveBeenCalledTimes(2);

            core.dispose();
        });

        it('acquireDone failure closes opened device', async () => {
            const api = createFakeApi();
            const core = createCore(api);
            await core.enumerate({ signal: abortSignal() });

            jest.spyOn(core.sessionsClient, 'acquireDone').mockResolvedValueOnce({
                success: false,
                error: { code: ERRORS.DEVICE_NOT_FOUND },
                id: 0,
            });

            const result = await core.acquire({
                path: PathPublic('1'),
                previous: 'null',
                signal: abortSignal(),
                sessionOwner: 'test',
            });
            expect(result).toMatchObject({
                success: false,
                error: { code: ERRORS.DEVICE_NOT_FOUND },
            });
            expect(api.closeDevice).toHaveBeenCalledWith(PathInternal('1'));

            core.dispose();
        });
    });

    describe('release failure paths', () => {
        it('releaseIntent failure returns early without closing device', async () => {
            const api = createFakeApi();
            const core = createCore(api);
            await core.enumerate({ signal: abortSignal() });

            // Unknown session → releaseIntent fails with SESSION_NOT_FOUND.
            const result = await core.release({ session: Session('999') });
            expect(result).toMatchObject({
                success: false,
                error: { code: ERRORS.SESSION_NOT_FOUND },
            });
            expect(api.closeDevice).not.toHaveBeenCalled();

            core.dispose();
        });

        it('getPathBySession failure after releaseIntent still releases lock', async () => {
            const api = createFakeApi();
            const core = createCore(api);
            await core.enumerate({ signal: abortSignal() });

            const acquired = await core.acquire({
                path: PathPublic('1'),
                previous: 'null',
                signal: abortSignal(),
                sessionOwner: 'test',
            });
            expect(acquired.success).toBe(true);
            if (!acquired.success) return;
            const { session } = acquired.payload;

            // Force getPathBySession to fail after releaseIntent succeeds.
            jest.spyOn(core.sessionsClient, 'getPathBySession').mockResolvedValueOnce({
                success: false,
                error: { code: ERRORS.SESSION_NOT_FOUND },
                id: 0,
            });

            const result = await core.release({ session });
            expect(result).toMatchObject({
                success: false,
                error: { code: ERRORS.SESSION_NOT_FOUND },
            });

            // Lock was released: a new acquire can proceed. releaseDone cleared the session,
            // so the previous session is null from the caller's perspective.
            const reacquired = await core.acquire({
                path: PathPublic('1'),
                previous: 'null',
                signal: abortSignal(),
                sessionOwner: 'test',
            });
            expect(reacquired.success).toBe(true);

            core.dispose();
        });
    });
});
