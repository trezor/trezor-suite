import { combineReducers } from '@reduxjs/toolkit';

import { metadataReducer, selectLabelingDataForAccount } from '@suite/metadata';
import { prepareSuiteSettingsReducer } from '@suite/settings';
import { suiteSyncReducer } from '@suite-common/suite-sync';
import { configureMockStore, initPreloadedState } from '@suite-common/test-utils';

import suiteReducer from '../../../reducers/suite/suiteReducer';
import { accountsReducer, transactionsReducer } from '../../../reducers/wallet';
import { extraDependencies } from '../../../support/extraDependencies';
import {
    accountReceivingCoins,
    accountSpendingCoins,
    moveLabelsForRbfAccountsFixture,
} from '../__fixtures__/moveLabelsForRbfAccounts.fixture';
import { moveLabelsForRbfMetadataStateFixture } from '../__fixtures__/moveLabelsForRbfMetadataState.fixture';
import {
    moveLabelsForRbfTransactionsFixture,
    originalTransactionSpendAccount,
    transactionSendingCoinsReplacement,
} from '../__fixtures__/moveLabelsForRbfTransactions.fixture';
import { moveLabelsForRbfThunk } from '../moveLabelsForRbfThunk';

const rootReducer = combineReducers({
    wallet: combineReducers({
        accounts: accountsReducer,
        transactions: transactionsReducer,
    }),
    metadata: metadataReducer,
    suite: suiteReducer,
    suiteSettings: prepareSuiteSettingsReducer(extraDependencies),
    suiteSync: suiteSyncReducer,
});

type TestState = ReturnType<typeof rootReducer>;

const initStore = ({
    wallet,
    metadata,
}: {
    wallet: TestState['wallet'];
    metadata: TestState['metadata'];
}) => {
    // State != suite AppState, therefore <any>
    const store = configureMockStore<any>({
        reducer: rootReducer,
        preloadedState: initPreloadedState({
            rootReducer,
            partialState: {
                wallet,
                metadata,
            },
        }),
    });

    return store;
};

describe(moveLabelsForRbfThunk.name, () => {
    it('moves the labels onto new RBF transaction and deletes the label of the chained transaction', async () => {
        const store = initStore({
            wallet: {
                accounts: moveLabelsForRbfAccountsFixture,
                transactions: {
                    fetchStatusDetail: {},
                    transactions: moveLabelsForRbfTransactionsFixture,
                    phishing: {},
                },
            },
            metadata: moveLabelsForRbfMetadataStateFixture,
        });

        await store.dispatch(
            moveLabelsForRbfThunk({
                newTxId: transactionSendingCoinsReplacement.txid,
                prevTxId: originalTransactionSpendAccount.txid,
                deviceStaticSessionId: 'abcd@cdef:1234',
                stateBeforePush: store.getState(),
            }),
        );

        const accountSpendingCoinsMetadata = selectLabelingDataForAccount(
            store.getState(),
            accountSpendingCoins.key,
        );

        expect(accountSpendingCoinsMetadata.outputLabels).toStrictEqual({
            [transactionSendingCoinsReplacement.txid]: {
                '1': '1A',
                '2': '1B',
            },
        });

        const accountReceivingCoinsMetadata = selectLabelingDataForAccount(
            store.getState(),
            accountReceivingCoins.key,
        );

        expect(accountReceivingCoinsMetadata.outputLabels).toStrictEqual({
            [transactionSendingCoinsReplacement.txid]: {
                '1': '2A',
                '2': '2B',
            },
        });
    });
});
