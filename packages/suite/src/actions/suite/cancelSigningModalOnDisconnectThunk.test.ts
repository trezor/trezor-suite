import { combineReducers } from '@reduxjs/toolkit';

import {
    MODAL_OPEN_USER_CONTEXT,
    type ModalRootState,
    closeModal,
    modalReducer,
    openDeferredModal,
    openModal,
    selectUserContextModalPayload,
} from '@suite/modal';
import { deviceActions } from '@suite-common/device';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { sendFormActions } from '@suite-common/wallet-core';

import { cancelSigningModalOnDisconnectThunk } from './cancelSigningModalOnDisconnectThunk';

const createStore = () =>
    createTestCompositionRoot<void, ModalRootState>({
        reducer: combineReducers({ modal: modalReducer }),
        serializableCheck: {
            ignoredActions: [MODAL_OPEN_USER_CONTEXT],
            ignoredPaths: ['modal.payload.decision', 'modal.cancelOnDisconnect'],
        },
    }).services.store;

type TestStore = ReturnType<typeof createStore>;

const device = mockSuiteDevice();

const disconnectToast = expect.objectContaining({
    type: notificationsActions.addToast.type,
    payload: expect.objectContaining({ type: 'sign-tx-error', error: 'Device disconnected' }),
});

describe('cancelSigningModalOnDisconnectThunk', () => {
    it.each([
        {
            name: 'Send transaction review',
            open: (store: TestStore): Promise<unknown> =>
                store.dispatch(
                    openDeferredModal(
                        { type: 'review-transaction' },
                        {
                            devicePath: device.path,
                            cancelWith: false,
                            onDisconnect: () =>
                                store.dispatch(sendFormActions.discardTransaction()),
                        },
                    ),
                ),
            answer: false,
            actions: [sendFormActions.discardTransaction(), closeModal(), disconnectToast],
        },
        {
            name: 'yield transaction preview',
            open: (store: TestStore): Promise<unknown> =>
                store.dispatch(
                    openDeferredModal(
                        { type: 'earn-yield-tx-simulation', data: undefined },
                        { devicePath: device.path, cancelWith: { value: false } },
                    ),
                ),
            answer: { value: false },
            actions: [closeModal(), disconnectToast],
        },
    ])('answers the pending $name as cancelled and tells the user why', async testCase => {
        const store = createStore();
        const decision = testCase.open(store);
        store.clearActions();

        store.dispatch(cancelSigningModalOnDisconnectThunk(device.path));

        await expect(decision).resolves.toEqual(testCase.answer);
        expect(store.getActions()).toEqual(testCase.actions);
    });

    it('closes an accepted review without discarding the approved Send transaction', async () => {
        const store = createStore();
        const decision = store.dispatch(
            openDeferredModal(
                { type: 'review-transaction' },
                {
                    devicePath: device.path,
                    cancelWith: false,
                    onDisconnect: () => store.dispatch(sendFormActions.discardTransaction()),
                },
            ),
        );
        const modal = selectUserContextModalPayload(store.getState());
        if (modal?.type !== 'review-transaction') throw new Error('Missing review');
        modal.decision.resolve(true);
        store.clearActions();

        store.dispatch(cancelSigningModalOnDisconnectThunk(device.path));
        store.dispatch(deviceActions.deviceDisconnect(device));

        await expect(decision).resolves.toBe(true);
        expect(store.getActions()).toEqual([closeModal(), deviceActions.deviceDisconnect(device)]);
        expect(selectUserContextModalPayload(store.getState())).toBeUndefined();
    });

    it('keeps the pending review open when a second device disconnects', async () => {
        const store = createStore();
        const other = mockSuiteDevice({ path: 'second-device' });
        const decision = store.dispatch(
            openDeferredModal(
                { type: 'review-transaction' },
                { devicePath: device.path, cancelWith: false },
            ),
        );
        const modal = selectUserContextModalPayload(store.getState());
        if (modal?.type !== 'review-transaction') throw new Error('Missing review');
        store.clearActions();

        store.dispatch(cancelSigningModalOnDisconnectThunk(other.path));
        store.dispatch(deviceActions.deviceDisconnect(other));

        expect(store.getActions()).toEqual([deviceActions.deviceDisconnect(other)]);
        expect(selectUserContextModalPayload(store.getState())).toBe(modal);
        modal.decision.resolve(true);
        await expect(decision).resolves.toBe(true);
    });

    it('does nothing when another modal is open', () => {
        const store = createStore();
        store.dispatch(openModal({ type: 'add-account', device: mockSuiteDevice() }));
        store.clearActions();

        store.dispatch(cancelSigningModalOnDisconnectThunk(device.path));

        expect(store.getActions()).toEqual([]);
    });
});
