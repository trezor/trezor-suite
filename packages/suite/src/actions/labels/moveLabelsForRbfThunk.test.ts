import { combineReducers } from '@reduxjs/toolkit';

import { metadataReducer, selectLabelingDataForAccount } from '@suite/metadata';
import { prepareSuiteSettingsReducer } from '@suite/settings';
import { deviceInitialState } from '@suite-common/device';
import { messageSystemInitialState } from '@suite-common/message-system';
import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { mockMigrateSuiteSyncLabelsForRbfTransaction } from '@suite-common/suite-rbf-labels-migrations-types/mocks';
import { suiteSyncReducer } from '@suite-common/suite-sync';
import { createTestCompositionRoot, initPreloadedState } from '@suite-common/test-utils';

import { accountsReducer } from 'src/reducers/wallet';

import {
    accountReceivingCoins,
    accountSpendingCoins,
    moveLabelsForRbfAccountsFixture,
} from './__fixtures__/moveLabelsForRbfAccounts.fixture';
import { moveLabelsForRbfMetadataStateFixture } from './__fixtures__/moveLabelsForRbfMetadataState.fixture';
import {
    moveLabelsForRbfTransactionsFixture,
    originalTransactionSpendAccount,
    transactionSendingCoinsReplacement,
} from './__fixtures__/moveLabelsForRbfTransactions.fixture';
import {
    type MoveLabelsForRbfThunkDeps,
    type MoveLabelsForRbfThunkState,
    asStateBeforePush,
    moveLabelsForRbfThunk,
} from './moveLabelsForRbfThunk';

const rootReducer = combineReducers({
    wallet: combineReducers({
        accounts: accountsReducer,
    }),
    metadata: metadataReducer,
    suite: (state: MoveLabelsForRbfThunkState['suite'] = { online: true }) => state,
    suiteSettings: prepareSuiteSettingsReducer({
        actionTypes: { storageLoad: mockActionType('storageLoad') },
        reducers: { storageLoadSuiteSettings: mockReducer() },
    }),
    suiteSync: suiteSyncReducer,
    device: (state = deviceInitialState) => state,
    messageSystem: (state = messageSystemInitialState) => state,
});

const initStore = ({
    wallet,
    metadata,
}: {
    wallet: MoveLabelsForRbfThunkState['wallet'];
    metadata: MoveLabelsForRbfThunkState['metadata'];
}) =>
    createTestCompositionRoot<MoveLabelsForRbfThunkDeps, MoveLabelsForRbfThunkState>({
        reducer: rootReducer,
        preloadedState: initPreloadedState({
            rootReducer,
            partialState: {
                wallet,
                metadata,
            },
        }),
        services: () => ({
            migrateSuiteSyncLabelsForRbfTransaction: mockMigrateSuiteSyncLabelsForRbfTransaction(),
        }),
    }).services.store;

describe(moveLabelsForRbfThunk.name, () => {
    it('moves the labels onto new RBF transaction and deletes the label of the chained transaction', async () => {
        const store = initStore({
            wallet: {
                accounts: moveLabelsForRbfAccountsFixture,
            },
            metadata: moveLabelsForRbfMetadataStateFixture,
        });
        const stateBeforePush = asStateBeforePush({
            wallet: {
                accounts: moveLabelsForRbfAccountsFixture,
                transactions: {
                    fetchStatusDetail: {},
                    transactions: moveLabelsForRbfTransactionsFixture,
                    phishing: {},
                },
            },
        });

        await store.dispatch(
            moveLabelsForRbfThunk({
                newTxId: transactionSendingCoinsReplacement.txid,
                prevTxId: originalTransactionSpendAccount.txid,
                deviceStaticSessionId: 'abcd@cdef:1234',
                stateBeforePush,
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
