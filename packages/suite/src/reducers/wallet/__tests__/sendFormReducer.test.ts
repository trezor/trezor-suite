import { STORAGE } from 'src/actions/suite/constants';
import { Action } from 'src/types/suite';
import { FormState, PrecomposedTransactionFinal } from 'src/types/wallet/sendForm';
import { accountsActions } from '@suite-common/wallet-core';
import { prepareSendFormReducer, initialState } from '../sendFormReducer';

import { Account, FormSignedTx } from '@suite-common/wallet-types';

import { PreloadStoreAction } from 'src/support/suite/preloadStore';
import { sendFormActions } from 'src/actions/wallet/sendFormActions';
import { extraDependencies } from 'src/support/extraDependencies';

// Since these mocked values are only used for assigning them and deleting from the state,
// their shape is completely irrelevant for these test. So to make this test file
// shorter and more readable, it is mocked as a plain string.
const formStateMock = 'FormStateMock' as unknown as FormState;
const precomposedTxMock = 'precomposedTx' as unknown as PrecomposedTransactionFinal;
const formSignedTxMock = 'formSignedTx' as unknown as FormSignedTx;

describe('sendFormReducer', () => {
    it('STORAGE.LOAD', () => {
        const action: Action = {
            type: STORAGE.LOAD,
            payload: {
                sendFormDrafts: [{ key: 'draft1', value: formStateMock }],
            },
        } as Extract<PreloadStoreAction, { type: typeof STORAGE.LOAD }>;

        const state = prepareSendFormReducer(extraDependencies)(initialState, action);
        expect(state.drafts).toEqual({
            draft1: formStateMock,
        });
    });

    it('SEND.STORE_DRAFT', () => {
        const action: Action = sendFormActions.storeDraft({
            accountKey: 'key1',
            formState: formStateMock,
        });

        const state = prepareSendFormReducer(extraDependencies)(initialState, action);
        expect(state.drafts).toEqual({
            key1: formStateMock,
        });
    });

    it('SEND.REMOVE_DRAFT', () => {
        const action: Action = sendFormActions.removeDraft({ accountKey: 'key1' });

        const state = prepareSendFormReducer(extraDependencies)(
            { ...initialState, drafts: { key1: formStateMock } },
            action,
        );
        expect(state.drafts).toEqual({});
    });

    it('accountsActions.removeAccount', () => {
        const action = accountsActions.removeAccount([{ key: 'deletedAccountKey' } as Account]);

        const state = prepareSendFormReducer(extraDependencies)(
            { ...initialState, drafts: { deletedAccountKey: formStateMock } },
            action,
        );
        expect(state.drafts).toEqual({});
    });

    it('SEND.REQUEST_SIGN_TRANSACTION - save', () => {
        const action: Action = sendFormActions.storePrecomposedTransaction({
            formState: formStateMock,
            transactionInfo: precomposedTxMock,
        });

        const state = prepareSendFormReducer(extraDependencies)(initialState, action);
        expect(state.precomposedTx).toEqual(precomposedTxMock);
        expect(state.precomposedForm).toEqual(formStateMock);
    });

    it('SEND.REQUEST_PUSH_TRANSACTION - save', () => {
        const action: Action = sendFormActions.storeSignedTransaction({
            coin: 'btc',
            tx: 'test',
        });

        const state = prepareSendFormReducer(extraDependencies)(initialState, action);
        expect(state.signedTx).toEqual({ coin: 'btc', tx: 'test' });
    });

    it('SEND.REQUEST_PUSH_TRANSACTION - delete', () => {
        const action: Action = sendFormActions.discardTransaction();

        const state = prepareSendFormReducer(extraDependencies)(
            {
                ...initialState,
                signedTx: formSignedTxMock,
                precomposedForm: formStateMock,
                precomposedTx: precomposedTxMock,
            },
            action,
        );
        expect(state.signedTx).toBeUndefined();
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
                signedTx: formSignedTxMock,
            },
            action,
        );
        expect(state.sendRaw).toBeUndefined();
        expect(state.precomposedTx).toBeUndefined();
        expect(state.precomposedForm).toBeUndefined();
        expect(state.signedTx).toBeUndefined();
    });
});
