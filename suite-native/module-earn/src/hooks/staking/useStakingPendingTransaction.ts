import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { CommonActions, useNavigation } from '@react-navigation/native';

import {
    type AccountsRootState,
    type FeesRootState,
    type TransactionsRootState,
    fetchAndUpdateAccountThunk,
    selectAccountNetworkSymbol,
    selectConvertedNetworkFeeInfo,
    selectTransactionByAccountKeyAndTxid,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import {
    getPollIntervalMs,
    isPending as isTransactionDataPending,
} from '@suite-common/wallet-utils';
import {
    AppTabsRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
    type StakingPendingTxParams,
    TransactionDetailStackRoutes,
} from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { type EarnFormDraftPrefix, type StakingPendingModal } from '../../types';
import { useEarnPendingTransactionSheet } from '../earn/useEarnPendingTransactionSheet';

type NavigationProps = StackNavigationProps<RootStackParamList, RootStackRoutes>;

type NavigateToPushedTransactionActionParams = {
    accountKey: AccountKey;
    amountInBaseUnits: string;
    failedTxid?: string;
    stakeType: EarnFormDraftPrefix;
};

const navigateToPushedTransactionAction = ({
    accountKey,
    amountInBaseUnits,
    failedTxid,
    stakeType,
}: NavigateToPushedTransactionActionParams) =>
    CommonActions.reset({
        index: 2,
        routes: [
            {
                name: RootStackRoutes.AppTabs,
                params: { screen: AppTabsRoutes.EarnStack },
            },
            {
                name: RootStackRoutes.StakingManagement,
                params: { accountKey },
            },
            // A confirmed transaction can still have failed on-chain (e.g. reverted contract
            // call) — the complete screen would falsely report success, so show the detail.
            failedTxid
                ? {
                      name: RootStackRoutes.TransactionDetailStack,
                      params: {
                          screen: TransactionDetailStackRoutes.TransactionDetail,
                          params: {
                              accountKey,
                              txid: failedTxid,
                              closeActionType: 'close',
                          },
                      },
                  }
                : {
                      name: RootStackRoutes.StakingTransactionComplete,
                      params: { stakeType, accountKey, amountInBaseUnits },
                  },
        ],
    });

type UseStakingPendingTransactionParams = {
    accountKey: AccountKey;
    pendingTransaction: StakingPendingTxParams | undefined;
    stakeType: EarnFormDraftPrefix;
};

type UseStakingPendingTransactionResult = {
    isPending: boolean;
    pendingModal: StakingPendingModal | null;
};

export const useStakingPendingTransaction = ({
    accountKey,
    pendingTransaction,
    stakeType,
}: UseStakingPendingTransactionParams): UseStakingPendingTransactionResult => {
    const { dispatch } = useServices(injectDispatch);
    const navigation = useNavigation<NavigationProps>();

    const txid = pendingTransaction?.txid;
    const amountInBaseUnits = pendingTransaction?.amountInBaseUnits;

    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const transaction = useSelector((state: TransactionsRootState) =>
        txid ? selectTransactionByAccountKeyAndTxid(state, accountKey, txid) : null,
    );
    const feeInfo = useSelector((state: FeesRootState) =>
        networkSymbol ? selectConvertedNetworkFeeInfo(state, networkSymbol) : null,
    );

    const isTransactionConfirmed = !!transaction && !isTransactionDataPending(transaction);
    const isTransactionFailed = transaction?.type === 'failed';
    const isPending = !!txid && !isTransactionConfirmed;
    const pollIntervalMs = getPollIntervalMs(feeInfo?.blockTime);

    useEffect(() => {
        if (!isPending) return undefined;

        const interval = setInterval(() => {
            dispatch(fetchAndUpdateAccountThunk({ accountKey }));
        }, pollIntervalMs);

        return () => clearInterval(interval);
    }, [accountKey, dispatch, isPending, pollIntervalMs]);

    useEffect(() => {
        if (!txid || amountInBaseUnits === undefined || !isTransactionConfirmed) return;

        navigation.dispatch(
            navigateToPushedTransactionAction({
                accountKey,
                amountInBaseUnits,
                failedTxid: isTransactionFailed ? txid : undefined,
                stakeType,
            }),
        );
    }, [
        accountKey,
        amountInBaseUnits,
        isTransactionConfirmed,
        isTransactionFailed,
        navigation,
        stakeType,
        txid,
    ]);

    const { pendingBottomSheetRef, isExploreDisabled, openInBlockchain } =
        useEarnPendingTransactionSheet({ accountKey, isPending, pendingTxid: txid });

    const pendingModal =
        isPending && pendingTransaction
            ? {
                  bottomSheetRef: pendingBottomSheetRef,
                  isExploreDisabled,
                  onExplorePress: openInBlockchain,
                  pendingTransaction,
              }
            : null;

    return { isPending, pendingModal };
};
