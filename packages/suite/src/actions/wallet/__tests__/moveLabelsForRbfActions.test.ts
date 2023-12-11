import { combineReducers } from '@reduxjs/toolkit';
import { accountsReducer, transactionsReducer } from '../../../reducers/wallet';
import { configureMockStore, initPreloadedState } from '@suite-common/test-utils';
import { findLabelsToBeMovedOrDeleted, moveLabelsForRbfAction } from '../moveLabelsForRbfActions';
import {
    accountReceivingCoins,
    accountSpendingCoins,
    moveLabelsForRbfAccountsFixture,
} from '../__fixtures__/moveLabelsForRbf/moveLabelsForRbfAccounts.fixture';
import {
    moveLabelsForRbfTransactionsFixture,
    originalTransactionSpendAccount,
    transactionSendingCoinsReplacement,
} from '../__fixtures__/moveLabelsForRbf/moveLabelsForRbfTransactions.fixture';
import metadataReducer, {
    selectLabelingDataForAccount,
} from '../../../reducers/suite/metadataReducer';
import { moveLabelsForRbfMetadataStateFixture } from '../__fixtures__/moveLabelsForRbf/moveLabelsForRbfMetadataState.fixture';
import suiteReducer from '../../../reducers/suite/suiteReducer';

const rootReducer = combineReducers({
    wallet: combineReducers({
        accounts: accountsReducer,
        transactions: transactionsReducer,
    }),
    metadata: metadataReducer,
    suite: suiteReducer,
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

describe(moveLabelsForRbfAction.name, () => {
    it('moves the labels onto new RBF transaction and deletes the label of the chained transaction', async () => {
        const store = initStore({
            wallet: {
                accounts: moveLabelsForRbfAccountsFixture,
                transactions: {
                    isLoading: false,
                    error: null,
                    transactions: moveLabelsForRbfTransactionsFixture,
                },
            },
            metadata: moveLabelsForRbfMetadataStateFixture,
        });

        const toBeMovedOrDeletedList = store.dispatch(
            findLabelsToBeMovedOrDeleted({
                prevTxid: originalTransactionSpendAccount.txid,
            }),
        );

        await store.dispatch(
            moveLabelsForRbfAction({
                toBeMovedOrDeletedList,
                newTxid: transactionSendingCoinsReplacement.txid,
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
