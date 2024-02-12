import { STORAGE } from 'src/actions/suite/constants';
import { SEND } from 'src/actions/wallet/constants';
import { Action } from 'src/types/suite';
import { FormState, PrecomposedTransactionFinal } from 'src/types/wallet/sendForm';
import { accountsActions } from '@suite-common/wallet-core';
import sendFormReducer, { initialState } from '../sendFormReducer';

import { Account, FormSignedTx } from '@suite-common/wallet-types';

import { PreloadStoreAction } from 'src/support/suite/preloadStore';

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

        const state = sendFormReducer(initialState, action);
        expect(state.drafts).toEqual({
            draft1: formStateMock,
        });
    });

    it('SEND.STORE_DRAFT', () => {
        const action: Action = {
            type: SEND.STORE_DRAFT,
            key: 'draft1',
            formState: formStateMock,
        };

        const state = sendFormReducer(initialState, action);
        expect(state.drafts).toEqual({
            draft1: formStateMock,
        });
    });

    it('SEND.REMOVE_DRAFT', () => {
        const action: Action = {
            type: SEND.REMOVE_DRAFT,
            key: 'draft1',
        };

        const state = sendFormReducer(
            { ...initialState, drafts: { draft1: formStateMock } },
            action,
        );
        expect(state.drafts).toEqual({});
    });

    it('accountsActions.removeAccount', () => {
        const action = accountsActions.removeAccount([{ key: 'deletedAccountKey' } as Account]);

        const state = sendFormReducer(
            { ...initialState, drafts: { deletedAccountKey: formStateMock } },
            action,
        );
        expect(state.drafts).toEqual({});
    });

    it('SEND.REQUEST_SIGN_TRANSACTION - save', () => {
        const action: Action = {
            type: SEND.REQUEST_SIGN_TRANSACTION,
            payload: {
                transactionInfo: precomposedTxMock,
                formValues: formStateMock,
            },
        };

        const state = sendFormReducer(initialState, action);
        expect(state.precomposedTx).toEqual(precomposedTxMock);
        expect(state.precomposedForm).toEqual(formStateMock);
    });

    it('SEND.REQUEST_SIGN_TRANSACTION - delete', () => {
        const action: Action = {
            type: SEND.REQUEST_SIGN_TRANSACTION,
        };

        const state = sendFormReducer(
            { ...initialState, precomposedForm: formStateMock, precomposedTx: precomposedTxMock },
            action,
        );
        expect(state.precomposedTx).toBeUndefined();
        expect(state.precomposedForm).toBeUndefined();
    });

    it('SEND.REQUEST_PUSH_TRANSACTION - save', () => {
        const action: Action = {
            type: SEND.REQUEST_PUSH_TRANSACTION,
            payload: formSignedTxMock,
        };

        const state = sendFormReducer(initialState, action);
        expect(state.signedTx).toEqual(formSignedTxMock);
    });

    it('SEND.REQUEST_PUSH_TRANSACTION - delete', () => {
        const action: Action = {
            type: SEND.REQUEST_PUSH_TRANSACTION,
        };

        const state = sendFormReducer({ ...initialState, signedTx: formSignedTxMock }, action);
        expect(state.signedTx).toBeUndefined();
    });

    it('SEND.SEND_RAW', () => {
        const action: Action = {
            type: SEND.SEND_RAW,
            payload: true,
        };

        const state = sendFormReducer({ ...initialState, sendRaw: false }, action);
        expect(state.sendRaw).toEqual(true);
    });

    it('SEND.DISPOSE', () => {
        const action: Action = {
            type: SEND.DISPOSE,
        };

        const state = sendFormReducer(
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
