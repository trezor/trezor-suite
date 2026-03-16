import {
    type SerializedTx,
    accountsActions,
    initialState,
    prepareSendFormReducer,
    sendFormActions,
} from '@suite-common/wallet-core';
import {
    type Account,
    type AccountKey,
    type FormState,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';

import { STORAGE } from 'src/actions/suite/constants';
import { extraDependencies } from 'src/support/extraDependencies';
import { type PreloadStoreAction } from 'src/support/suite/preloadStore';
import { type Action } from 'src/types/suite';

// Since these mocked values are only used for assigning them and deleting from the state,
// their shape is completely irrelevant for these test. So to make this test file
// shorter and more readable, it is mocked as a plain string.
const formStateMock = 'FormStateMock' as unknown as FormState;
const precomposedTxMock = 'precomposedTx' as unknown as PrecomposedTransactionFinal;
const formSignedTxMock = 'formSignedTx' as unknown as SerializedTx;

describe('sendFormReducer', () => {
    it('STORAGE.LOAD', () => {
        const action: Action = {
            type: STORAGE.LOAD,
            payload: {
                sendFormDrafts: [
                    {
                        key: 'draft1' as AccountKey, // Todo: create properly via `createAccountKey()`
                        value: formStateMock,
                    },
                ],
            },
        } as Extract<PreloadStoreAction, { type: typeof STORAGE.LOAD }>;

        const state = prepareSendFormReducer(extraDependencies)(initialState, action);
        expect(state.drafts).toEqual({
            draft1: formStateMock,
        });
    });

    it('SEND.STORE_DRAFT', () => {
        const action: Action = sendFormActions.storeDraft({
            accountKey: 'key1' as AccountKey, // Todo: create properly via `createAccountKey()`
            formState: formStateMock,
        });

        const state = prepareSendFormReducer(extraDependencies)(initialState, action);
        expect(state.drafts).toEqual({
            key1: formStateMock,
        });
    });

    it('SEND.REMOVE_DRAFT', () => {
        const action: Action = sendFormActions.removeDraft({
            accountKey: 'key1' as AccountKey, // Todo: create properly via `createAccountKey()`
        });

        const state = prepareSendFormReducer(extraDependencies)(
            { ...initialState, drafts: { ['key1' as AccountKey]: formStateMock } },
            action,
        );
        expect(state.drafts).toEqual({});
    });

    it('accountsActions.removeAccount', () => {
        const action = accountsActions.removeAccount([
            { key: 'deletedAccountKey' as AccountKey } as Account, // Todo: create properly via `createAccountKey()`
        ]);

        const state = prepareSendFormReducer(extraDependencies)(
            { ...initialState, drafts: { ['deletedAccountKey' as AccountKey]: formStateMock } },
            action,
        );
        expect(state.drafts).toEqual({});
    });

    it('SEND.REQUEST_SIGN_TRANSACTION - save', () => {
        const action: Action = sendFormActions.storePrecomposedTransaction({
            formState: formStateMock,
            precomposedTransaction: precomposedTxMock,
        });

        const state = prepareSendFormReducer(extraDependencies)(initialState, action);
        expect(state.precomposedTx).toEqual(precomposedTxMock);
    });

    it('SEND.REQUEST_PUSH_TRANSACTION - save', () => {
        const action: Action = sendFormActions.storeSignedTransaction({
            serializedTx: {
                symbol: 'btc',
                tx: 'test',
            },
        });

        const state = prepareSendFormReducer(extraDependencies)(initialState, action);
        expect(state.serializedTx).toEqual({ symbol: 'btc', tx: 'test' });
    });

    it('SEND.REQUEST_PUSH_TRANSACTION - delete', () => {
        const action: Action = sendFormActions.discardTransaction();

        const state = prepareSendFormReducer(extraDependencies)(
            {
                ...initialState,
                serializedTx: formSignedTxMock,
                precomposedForm: formStateMock,
                precomposedTx: precomposedTxMock,
            },
            action,
        );
        expect(state.serializedTx).toBeUndefined();
        expect(state.precomposedTx).toBeUndefined();
        expect(state.precomposedForm).toBeUndefined();
    });

    it('SEND.SEND_RAW', () => {
        const action: Action = sendFormActions.sendRaw(true);

        const state = prepareSendFormReducer(extraDependencies)(
            { ...initialState, sendRaw: false },
            action,
        );
        expect(state.sendRaw).toEqual(true);
    });

    it('SEND.DISPOSE', () => {
        const action: Action = sendFormActions.dispose();

        const state = prepareSendFormReducer(extraDependencies)(
            {
                ...initialState,
                sendRaw: true,
                precomposedTx: precomposedTxMock,
                precomposedForm: formStateMock,
                serializedTx: formSignedTxMock,
            },
            action,
        );
        expect(state.sendRaw).toBeUndefined();
        expect(state.precomposedTx).toBeUndefined();
        expect(state.precomposedForm).toBeUndefined();
        expect(state.serializedTx).toBeUndefined();
    });
});
