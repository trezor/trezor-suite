import { combineReducers } from '@reduxjs/toolkit';

import { type AnalyticsDep, type AnalyticsSharedEvents } from '@suite-common/analytics';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';
import { asDeviceUniquePath } from '@trezor/connect';
import { type WithServices } from '@trezor/redux-utils';

import { discoveryActions } from './discoveryActions';
import { prepareDiscoveryReducer } from './discoveryReducer';
import {
    type UpdateDiscoveryThunkState,
    deleteDiscoveryThunk,
    updateDiscoveryThunk,
} from './discoveryStateThunks';

const devicePath = asDeviceUniquePath('device-path');
const analytics = mockAnalytics<AnalyticsSharedEvents>();
const discoveryReducer = prepareDiscoveryReducer(undefined);

const initStore = () =>
    createTestCompositionRoot<WithServices<AnalyticsDep>, UpdateDiscoveryThunkState>({
        services: () => ({ analytics }),
        reducer: { wallet: combineReducers({ discovery: discoveryReducer }) },
    }).services.store;

beforeEach(() => {
    jest.clearAllMocks();
});

describe('discovery state thunks', () => {
    it('reports the outcome of a run together with its trigger', () => {
        const store = initStore();

        store.dispatch(discoveryActions.startDiscovery(devicePath, { trigger: 'device-connect' }));
        store.dispatch(
            updateDiscoveryThunk({
                status: { status: 'progress', total: 2, progress: 1 },
                path: devicePath,
            }),
        );
        store.dispatch(updateDiscoveryThunk({ status: { status: 'complete' }, path: devicePath }));

        expect(analytics.report).toHaveBeenCalledTimes(1);
        expect(analytics.report).toHaveBeenCalledWith({
            type: 'accounts/discovery-result',
            payload: { outcome: 'complete', trigger: 'device-connect' },
        });
    });

    it('reports a failure with its error code and without the error message', () => {
        const store = initStore();

        store.dispatch(discoveryActions.startDiscovery(devicePath, { trigger: 'retry' }));
        store.dispatch(
            updateDiscoveryThunk({
                status: {
                    status: 'failed',
                    error: 'Backend disconnected: xpub6abc',
                    errorCode: 'Backend_Disconnected',
                },
                path: devicePath,
            }),
        );

        expect(analytics.report).toHaveBeenCalledWith({
            type: 'accounts/discovery-result',
            payload: { outcome: 'failed', trigger: 'retry', errorCode: 'Backend_Disconnected' },
        });
    });

    it('falls back to the unknown error code when a failure carries none', () => {
        const store = initStore();

        store.dispatch(discoveryActions.startDiscovery(devicePath, { trigger: 'retry' }));
        store.dispatch(
            updateDiscoveryThunk({ status: { status: 'failed', error: 'oops' }, path: devicePath }),
        );

        expect(analytics.report).toHaveBeenCalledWith({
            type: 'accounts/discovery-result',
            payload: { outcome: 'failed', trigger: 'retry', errorCode: 'Failure_UnknownCode' },
        });
    });

    it('reports an error code outside the known Connect and firmware codes as unknown', () => {
        const store = initStore();

        store.dispatch(discoveryActions.startDiscovery(devicePath, { trigger: 'retry' }));
        store.dispatch(
            updateDiscoveryThunk({
                status: { status: 'failed', error: 'socket hang up', errorCode: 'ECONNRESET' },
                path: devicePath,
            }),
        );

        expect(analytics.report).toHaveBeenCalledWith({
            type: 'accounts/discovery-result',
            payload: { outcome: 'failed', trigger: 'retry', errorCode: 'Failure_UnknownCode' },
        });
    });

    it.each(['Failure_ActionCancelled', 'Failure_PinCancelled'])(
        'reports a failure cancelled on the device (%s) as cancelled, without an error code',
        errorCode => {
            const store = initStore();

            store.dispatch(discoveryActions.startDiscovery(devicePath, { trigger: 'add-wallet' }));
            store.dispatch(
                updateDiscoveryThunk({
                    status: { status: 'failed', error: 'Cancelled', errorCode },
                    path: devicePath,
                }),
            );

            expect(analytics.report).toHaveBeenCalledWith({
                type: 'accounts/discovery-result',
                payload: { outcome: 'cancelled', trigger: 'add-wallet' },
            });
        },
    );

    it('reports a failure from a cancel of every Connect call as failed with its code', () => {
        const store = initStore();

        store.dispatch(discoveryActions.startDiscovery(devicePath, { trigger: 'add-wallet' }));
        store.dispatch(
            updateDiscoveryThunk({
                status: { status: 'failed', error: 'tx-timeout', errorCode: 'Method_Cancel' },
                path: devicePath,
            }),
        );

        expect(analytics.report).toHaveBeenCalledWith({
            type: 'accounts/discovery-result',
            payload: { outcome: 'failed', trigger: 'add-wallet', errorCode: 'Method_Cancel' },
        });
    });

    it('reports only the first outcome of a run', () => {
        const store = initStore();

        store.dispatch(discoveryActions.startDiscovery(devicePath, { trigger: 'add-wallet' }));
        store.dispatch(
            updateDiscoveryThunk({ status: { status: 'passphrase-mismatch' }, path: devicePath }),
        );
        store.dispatch(updateDiscoveryThunk({ status: { status: 'cancelled' }, path: devicePath }));

        expect(analytics.report).toHaveBeenCalledTimes(1);
        expect(analytics.report).toHaveBeenCalledWith({
            type: 'accounts/discovery-result',
            payload: { outcome: 'passphrase-mismatch', trigger: 'add-wallet' },
        });
    });

    it('reports every run separately', () => {
        const store = initStore();

        store.dispatch(discoveryActions.startDiscovery(devicePath, { trigger: 'device-connect' }));
        store.dispatch(updateDiscoveryThunk({ status: { status: 'complete' }, path: devicePath }));
        store.dispatch(discoveryActions.startDiscovery(devicePath, { trigger: 'coin-toggle' }));
        store.dispatch(
            updateDiscoveryThunk({
                status: { status: 'failed', error: 'offline', errorCode: 'Transport_Missing' },
                path: devicePath,
            }),
        );

        expect(analytics.report).toHaveBeenCalledTimes(2);
        expect(analytics.report).toHaveBeenNthCalledWith(1, {
            type: 'accounts/discovery-result',
            payload: { outcome: 'complete', trigger: 'device-connect' },
        });
        expect(analytics.report).toHaveBeenNthCalledWith(2, {
            type: 'accounts/discovery-result',
            payload: { outcome: 'failed', trigger: 'coin-toggle', errorCode: 'Transport_Missing' },
        });
    });

    it('does not report a silent outcome, such as a cancel that restarts the run', () => {
        const store = initStore();

        store.dispatch(discoveryActions.startDiscovery(devicePath, { trigger: 'add-wallet' }));
        store.dispatch(
            updateDiscoveryThunk({
                status: { status: 'cancelled' },
                path: devicePath,
                isSilent: true,
            }),
        );
        store.dispatch(discoveryActions.startDiscovery(devicePath, { trigger: 'add-wallet' }));
        store.dispatch(updateDiscoveryThunk({ status: { status: 'complete' }, path: devicePath }));

        expect(analytics.report).toHaveBeenCalledTimes(1);
        expect(analytics.report).toHaveBeenCalledWith({
            type: 'accounts/discovery-result',
            payload: { outcome: 'complete', trigger: 'add-wallet' },
        });
    });

    it('reports a run that is deleted before it ends as cancelled', () => {
        const store = initStore();

        store.dispatch(discoveryActions.startDiscovery(devicePath, { trigger: 'device-switch' }));
        store.dispatch(deleteDiscoveryThunk(devicePath));

        expect(analytics.report).toHaveBeenCalledTimes(1);
        expect(analytics.report).toHaveBeenCalledWith({
            type: 'accounts/discovery-result',
            payload: { outcome: 'cancelled', trigger: 'device-switch' },
        });
    });

    it('does not report the deletion of a run that has already ended', () => {
        const store = initStore();

        store.dispatch(discoveryActions.startDiscovery(devicePath, { trigger: 'device-connect' }));
        store.dispatch(updateDiscoveryThunk({ status: { status: 'complete' }, path: devicePath }));
        store.dispatch(deleteDiscoveryThunk(devicePath));

        expect(analytics.report).toHaveBeenCalledTimes(1);
        expect(analytics.report).toHaveBeenCalledWith({
            type: 'accounts/discovery-result',
            payload: { outcome: 'complete', trigger: 'device-connect' },
        });
    });

    it.each([
        { status: 'passphrase-mismatch' as const },
        {
            status: 'passphrase-duplicate' as const,
            duplicateDeviceStaticSessionId: 'wallet@device:1' as const,
        },
    ])('does not report the deletion of a run that ended as $status', status => {
        const store = initStore();

        store.dispatch(discoveryActions.startDiscovery(devicePath, { trigger: 'add-wallet' }));
        store.dispatch(updateDiscoveryThunk({ status, path: devicePath }));
        store.dispatch(deleteDiscoveryThunk(devicePath));

        expect(analytics.report).toHaveBeenCalledTimes(1);
        expect(analytics.report).toHaveBeenCalledWith({
            type: 'accounts/discovery-result',
            payload: { outcome: status.status, trigger: 'add-wallet' },
        });
    });

    it('ignores an outcome for a device without a started run', () => {
        const store = initStore();

        store.dispatch(updateDiscoveryThunk({ status: { status: 'cancelled' }, path: devicePath }));

        expect(analytics.report).not.toHaveBeenCalled();
    });
});
