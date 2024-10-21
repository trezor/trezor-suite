import { mergeDeepObject } from '@trezor/utils';
import { connectInitThunk } from '@suite-common/connect-init';
import { testMocks } from '@suite-common/test-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { CommonParams, DeviceModelInternal, UI, UI_EVENT } from '@trezor/connect';

import { configureStore } from 'src/support/tests/configureStore';
import { SUITE } from 'src/actions/suite/constants';
import { BACKUP } from 'src/actions/backup/constants';
import * as backupActions from 'src/actions/backup/backupActions';
import { value } from '@trezor/utxo-lib/src/payments/lazy';

export const getInitialState = (override: any) => {
    const defaults = {
        suite: {
            locks: [3],
            settings: { debug: {} },
        },
        // doesnt affect anything, just needed for TrezorConnect.init action
        device: {
            selectedDevice: {
                connected: true,
                type: 'acquired',
                features: {
                    major_version: 2,
                    internal_model: DeviceModelInternal.T2T1,
                },
            },
            devices: [],
        },
        wallet: {
            settings: {
                enabledNetworks: ['btc'],
            },
        },
    };
    if (override) {
        return mergeDeepObject(defaults, override);
    }

    return defaults;
};

const mockStore = configureStore<ReturnType<typeof getInitialState>, any>();

describe('Backup Actions', () => {
    beforeAll(() => {
        jest.spyOn(console, 'error').mockImplementation();
    });
    afterAll(() => {
        jest.clearAllMocks();
    });

    it('backup success', async () => {
        const { emitTestEvent } = testMocks.getTrezorConnectMock();
        testMocks.setTrezorConnectFixtures({ success: true });
        const state = getInitialState({});
        const store = mockStore(state);
        await store.dispatch(connectInitThunk());

        const p = store.dispatch(
            backupActions.backupDevice({
                device: store.getState().device.selectedDevice as CommonParams['device'],
            }),
        );
        emitTestEvent(UI_EVENT, {
            type: UI.CALL_IN_PROGRESS,
            payload: { value: true },
        });
        emitTestEvent(UI_EVENT, {
            type: UI.CALL_IN_PROGRESS,
            payload: { value: false },
        });
        await p;

        expect(store.getActions().shift()).toMatchObject({
            type: connectInitThunk.pending.type,
            payload: undefined,
        });
        expect(store.getActions().shift()).toMatchObject({
            type: connectInitThunk.fulfilled.type,
            payload: undefined,
        });
        expect(store.getActions().shift()).toEqual({
            type: BACKUP.SET_STATUS,
            payload: 'in-progress',
        });
        expect(store.getActions().shift()).toEqual({ type: SUITE.LOCK_DEVICE, payload: true });
        expect(store.getActions().shift()).toEqual({
            type: UI.CALL_IN_PROGRESS,
            payload: { value: true },
        });
        expect(store.getActions().shift()).toEqual({ type: SUITE.LOCK_DEVICE, payload: false });
        expect(store.getActions().shift()).toEqual({
            type: UI.CALL_IN_PROGRESS,
            payload: { value: false },
        });
        expect(store.getActions().shift()).toMatchObject({
            type: notificationsActions.addToast.type,
            payload: { type: 'backup-success' },
        });
    });

    it('backup error', async () => {
        const { emitTestEvent } = testMocks.getTrezorConnectMock();
        testMocks.setTrezorConnectFixtures({
            success: false,
            payload: { error: 'avadakedavra' },
        });

        const state = getInitialState({});
        const store = mockStore(state);
        await store.dispatch(connectInitThunk());

        const p = store.dispatch(
            backupActions.backupDevice({
                device: store.getState().device.selectedDevice as CommonParams['device'],
            }),
        );
        emitTestEvent(UI_EVENT, {
            type: UI.CALL_IN_PROGRESS,
            payload: { value: true },
        });
        emitTestEvent(UI_EVENT, {
            type: UI.CALL_IN_PROGRESS,
            payload: { value: false },
        });
        await p;

        expect(store.getActions().shift()).toMatchObject({
            type: connectInitThunk.pending.type,
            payload: undefined,
        });
        expect(store.getActions().shift()).toMatchObject({
            type: connectInitThunk.fulfilled.type,
            payload: undefined,
        });
        expect(store.getActions().shift()).toEqual({
            type: BACKUP.SET_STATUS,
            payload: 'in-progress',
        });
        expect(store.getActions().shift()).toEqual({ type: SUITE.LOCK_DEVICE, payload: true });
        expect(store.getActions().shift()).toEqual({
            type: UI.CALL_IN_PROGRESS,
            payload: { value: true },
        });
        expect(store.getActions().shift()).toEqual({ type: SUITE.LOCK_DEVICE, payload: false });
        expect(store.getActions().shift()).toEqual({
            type: UI.CALL_IN_PROGRESS,
            payload: { value: false },
        });
        expect(store.getActions().shift()).toMatchObject({
            type: notificationsActions.addToast.type,
            payload: { type: 'backup-failed' },
        });
    });
});
