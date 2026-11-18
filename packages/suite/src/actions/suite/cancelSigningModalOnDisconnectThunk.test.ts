import { combineReducers } from '@reduxjs/toolkit';

import {
    MODAL_OPEN_USER_CONTEXT,
    type ModalRootState,
    modalReducer,
    openDeferredModal,
    openModal,
} from '@suite/modal';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { sendFormActions } from '@suite-common/wallet-core';

import { cancelSigningModalOnDisconnectThunk } from './cancelSigningModalOnDisconnectThunk';

const createStore = () =>
    createTestCompositionRoot<void, ModalRootState>({
        reducer: combineReducers({ modal: modalReducer }),
        serializableCheck: { ignoredActions: [MODAL_OPEN_USER_CONTEXT] },
    }).services.store;

type TestStore = ReturnType<typeof createStore>;

const disconnectToast = expect.objectContaining({
    type: notificationsActions.addToast.type,
    payload: expect.objectContaining({ type: 'sign-tx-error', error: 'Device disconnected' }),
});

describe('cancelSigningModalOnDisconnectThunk', () => {
    it.each([
        {
            name: 'transaction review',
            open: (store: TestStore): Promise<unknown> | undefined =>
                store.dispatch(openDeferredModal({ type: 'review-transaction' })),
            answer: false,
            actions: [sendFormActions.discardTransaction(), disconnectToast],
        },
        {
            name: 'yield transaction preview',
            open: (store: TestStore): Promise<unknown> | undefined =>
                store.dispatch(
                    openDeferredModal({ type: 'earn-yield-tx-simulation', data: undefined }),
                ),
            answer: { value: false },
            actions: [disconnectToast],
        },
        {
            name: 'Tron vote consent',
            open: (store: TestStore): Promise<unknown> | undefined =>
                store.dispatch(
                    openDeferredModal({ type: 'tron-vote-consent', representatives: [] }),
                ),
            answer: false,
            actions: [disconnectToast],
        },
    ])('answers the pending $name as cancelled and tells the user why', async testCase => {
        const store = createStore();
        const decision = testCase.open(store);
        store.clearActions();

        store.dispatch(cancelSigningModalOnDisconnectThunk());

        await expect(decision).resolves.toEqual(testCase.answer);
        expect(store.getActions()).toEqual(testCase.actions);
    });

    it('does nothing when another modal is open', () => {
        const store = createStore();
        store.dispatch(openModal({ type: 'add-account', device: mockSuiteDevice() }));
        store.clearActions();

        store.dispatch(cancelSigningModalOnDisconnectThunk());

        expect(store.getActions()).toEqual([]);
    });
});
