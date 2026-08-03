import TrezorConnect from '@trezor/connect';

import * as METADATA from './metadataConstants';
import * as metadataPasswordsActions from './metadataPasswordsActions';
import * as metadataProviderActions from './metadataProviderThunks';

// module namespace exports are non-configurable under babel esModule interop, so
// getProviderInstanceThunk can't be spied directly; mock the module, keep everything
// else real (fetchIntervals singleton + handleProviderError are used by the code
// under test).
jest.mock('./metadataProviderThunks', () => ({
    ...jest.requireActual('./metadataProviderThunks'),
    getProviderInstanceThunk: jest.fn(),
}));

/**
 * Regression test for the fire-and-forget password fetch interval.
 *
 * `init` installs a setInterval that dispatches the private `fetchPasswordsThunk`
 * thunk. That thunk returns a promise which rejects on a failed provider fetch
 * or a decrypt error. Without a `.catch` on the interval dispatch, every failing
 * poll produced a recurring unhandled promise rejection in the renderer (a
 * distinct DoS/noise vector: the untrusted provider blob is attacker-influenced
 * and the interval fires forever). The sibling labels interval
 * (fetchAndSaveMetadata) never rejects because it self-catches internally.
 */

const flushMicrotasks = () => new Promise(resolve => setImmediate(resolve));

describe('metadataPasswordsActions.initThunk - fetch interval rejection handling', () => {
    const originalSetInterval = global.setInterval;
    let intervalCallbacks: Array<() => void>;
    let unhandledRejections: unknown[];
    const onUnhandledRejection = (reason: unknown) => {
        unhandledRejections.push(reason);
    };

    beforeEach(() => {
        intervalCallbacks = [];
        unhandledRejections = [];
        // capture interval callbacks instead of really scheduling them
        (global as any).setInterval = (cb: () => void) => {
            intervalCallbacks.push(cb);

            return 1 as any;
        };
        // fetchIntervals is a module-level singleton; a stale entry would skip install
        const intervals = metadataProviderActions.fetchIntervals as Record<string, unknown>;
        Object.keys(intervals).forEach(key => {
            delete intervals[key];
        });
        process.prependListener('unhandledRejection', onUnhandledRejection);

        jest.spyOn(TrezorConnect, 'cipherKeyValue').mockImplementation(() =>
            Promise.resolve({
                success: true,
                payload: {
                    value: '20c8bf0701213cdcf4c2f56fd0096c1772322d42fb9c4d0ddf6bb122d713d2f3',
                } as any,
            }),
        );

        // a provider whose details succeed but whose file fetch fails, so
        // fetchPasswordsThunk reaches `reject(result)`
        const failingProvider: any = {
            clientId: 'pw-client',
            type: 'dropbox',
            getProviderDetails: () =>
                Promise.resolve({
                    success: true,
                    payload: { clientId: 'pw-client', type: 'dropbox', user: '', isCloud: true },
                }),
            getFileContent: () =>
                Promise.resolve({ success: false, code: 'PROVIDER_ERROR', error: 'boom' }),
            error: (code: string, message: string) => ({ success: false, code, error: message }),
        };
        (metadataProviderActions.getProviderInstanceThunk as jest.Mock).mockReturnValue(
            () => failingProvider,
        );
    });

    afterEach(() => {
        process.removeListener('unhandledRejection', onUnhandledRejection);
        (global as any).setInterval = originalSetInterval;
        jest.restoreAllMocks();
    });

    const buildStore = () => {
        const state: any = {
            device: {
                selectedDevice: {
                    path: '1',
                    state: { staticSessionId: 'session-123' },
                    connected: true,
                    passwords: {},
                },
            },
            metadata: {
                enabled: true,
                initiating: false,
                providers: [{ clientId: 'pw-client', type: 'dropbox' }],
                hasLegacyLabelsMigrated: {},
                selectedProvider: { labels: '', passwords: 'pw-client' },
                error: {},
            },
            suite: { online: true },
        };

        const getState = () => state;
        const dispatch: any = (action: any) => {
            if (typeof action === 'function') {
                return action(dispatch, getState);
            }
            if (action?.type === METADATA.SET_DEVICE_METADATA_PASSWORDS) {
                state.device.selectedDevice.passwords = action.payload.metadata;
            }

            return action;
        };

        return { dispatch, getState };
    };

    it('installs the interval and swallows a rejecting poll instead of leaking an unhandled rejection', async () => {
        const { dispatch, getState } = buildStore();

        await dispatch(metadataPasswordsActions.initThunk());

        // the interval must have been installed with the passwords keys set
        expect(intervalCallbacks).toHaveLength(1);
        expect(getState().device.selectedDevice.passwords[1].fileName).toBeTruthy();

        // clear rejections from init's own (already handled) first fetch
        await flushMicrotasks();
        unhandledRejections = [];

        // fire a polling tick: fetchPasswordsThunk rejects (provider file fetch fails)
        intervalCallbacks[0]!();
        await flushMicrotasks();
        await flushMicrotasks();

        expect(unhandledRejections).toEqual([]);
    });
});
