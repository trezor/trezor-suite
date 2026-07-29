import { type ExtraDependencies } from '@suite-common/redux-utils';
import { extraDependenciesCommonMock } from '@suite-common/test-utils';
import {
    type Account,
    type AccountKey,
    type FormState,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';

import { sendFormActions } from './sendFormActions';
import { initialState, prepareSendFormReducer } from './sendFormReducer';
import { type SerializedTx } from './sendFormTypes';
import { accountsActions } from '../accounts/accountsActions';

const extraDependencies: ExtraDependencies = {
    ...extraDependenciesCommonMock,
    reducers: {
        ...extraDependenciesCommonMock.reducers,
        storageLoadFormDrafts: (state, { payload }) => {
            payload.sendFormDrafts.forEach(
                ({ key, value }: { key: AccountKey; value: FormState }) => {
                    state.drafts[key] = value;
                },
            );
        },
    },
};

// Since these mocked values are only used for assigning them and deleting from the state,
// their shape is completely irrelevant for these test. So to make this test file
// shorter and more readable, it is mocked as a plain string.
const formStateMock = 'FormStateMock' as unknown as FormState;
const precomposedTxMock = 'precomposedTx' as unknown as PrecomposedTransactionFinal;
const formSignedTxMock = 'formSignedTx' as unknown as SerializedTx;

describe('sendFormReducer', () => {
    it('STORAGE.LOAD', () => {
        const action = {
            type: extraDependencies.actionTypes.storageLoad,
            payload: {
                sendFormDrafts: [
                    {
                        key: 'draft1' as AccountKey, // Todo: create properly via `createAccountKey()`
                        value: formStateMock,
                    },
                ],
            },
        };

        const state = prepareSendFormReducer(extraDependencies)(initialState, action);
        expect(state.drafts).toEqual({
            draft1: formStateMock,
        });
    });

    it('SEND.STORE_DRAFT', () => {
        const action = sendFormActions.storeDraft({
            accountKey: 'key1' as AccountKey, // Todo: create properly via `createAccountKey()`
            formState: formStateMock,
        });

        const state = prepareSendFormReducer(extraDependencies)(initialState, action);
        expect(state.drafts).toEqual({
            key1: formStateMock,
        });
    });

    it('SEND.REMOVE_DRAFT', () => {
        const action = sendFormActions.removeDraft({
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
        const action = sendFormActions.storePrecomposedTransaction({
            formState: formStateMock,
            precomposedTransaction: precomposedTxMock,
        });

        const state = prepareSendFormReducer(extraDependencies)(initialState, action);
        expect(state.precomposedTx).toEqual(precomposedTxMock);
    });

    it('SEND.REQUEST_PUSH_TRANSACTION - save', () => {
        const action = sendFormActions.storeSignedTransaction({
            serializedTx: {
                symbol: 'btc',
                tx: 'test',
            },
        });

        const state = prepareSendFormReducer(extraDependencies)(initialState, action);
        expect(state.serializedTx).toEqual({ symbol: 'btc', tx: 'test' });
    });

    it('SEND.REQUEST_PUSH_TRANSACTION - delete', () => {
        const action = sendFormActions.discardTransaction();

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
        const action = sendFormActions.sendRaw(true);

        const state = prepareSendFormReducer(extraDependencies)(
            { ...initialState, sendRaw: false },
            action,
        );
        expect(state.sendRaw).toEqual(true);
    });

    it('SEND.DISPOSE', () => {
        const action = sendFormActions.dispose();

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
