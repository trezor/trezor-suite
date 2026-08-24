import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { CommonActions, useNavigation } from '@react-navigation/native';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type FeesRootState,
    type TransactionsRootState,
    fetchAndUpdateAccountThunk,
    selectAccountNetworkSymbol,
    selectConvertedNetworkFeeInfo,
    selectTransactionByAccountKeyAndTxid,
    sendFormActions,
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
    TransactionDetailStackRoutes,
} from '@suite-native/navigation';

import { type EarnFormDraftPrefix } from '../types';
import { resolveStakingTargetRoute } from '../utils/resolveStakingTargetRoute';

type NavigationProps = StackNavigationProps<RootStackParamList, RootStackRoutes>;

const stakeTypeCompleteRoute: Record<EarnFormDraftPrefix, RootStackRoutes> = {
    stake: RootStackRoutes.EarnTransactionComplete,
    unstake: RootStackRoutes.UnstakeTransactionComplete,
    claim: RootStackRoutes.ClaimTransactionComplete,
};

interface NavigateToPushedTransactionActionProps {
    accountKey: AccountKey;
    amountInBaseUnits: string;
    failedTxid?: string;
    stakeType: EarnFormDraftPrefix;
    symbol: NetworkSymbol;
}

const navigateToPushedTransactionAction = ({
    accountKey,
    amountInBaseUnits,
    failedTxid,
    stakeType,
    symbol,
}: NavigateToPushedTransactionActionProps) =>
    CommonActions.reset({
        index: 2,
        routes: [
            {
                name: RootStackRoutes.AppTabs,
                params: { screen: AppTabsRoutes.EarnStack },
            },
            {
                name: resolveStakingTargetRoute(symbol),
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
                      name: stakeTypeCompleteRoute[stakeType],
                      params: { accountKey, amountInBaseUnits },
                  },
        ],
    });

type UseNavigateAfterPushedTransactionParams = {
    accountKey: AccountKey;
    amountInBaseUnits: string;
    markReviewNavigationSuccess: () => void;
    stakeType: EarnFormDraftPrefix;
};

export const useNavigateAfterPushedTransaction = ({
    accountKey,
    amountInBaseUnits,
    markReviewNavigationSuccess,
    stakeType,
}: UseNavigateAfterPushedTransactionParams) => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
    const [txid, setTxid] = useState('');
    const [submittedAt, setSubmittedAt] = useState<Date | null>(null);

    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    const transaction = useSelector((state: TransactionsRootState) =>
        selectTransactionByAccountKeyAndTxid(state, accountKey, txid),
    );
    const isTransactionConfirmed = !!transaction && !isTransactionDataPending(transaction);
    const isTransactionFailed = transaction?.type === 'failed';

    const feeInfo = useSelector((state: FeesRootState) =>
        networkSymbol ? selectConvertedNetworkFeeInfo(state, networkSymbol) : null,
    );
    const pollIntervalMs = getPollIntervalMs(feeInfo?.blockTime);

    const shouldPollPendingTransaction = !!txid && !isTransactionConfirmed;

    useEffect(() => {
        if (!shouldPollPendingTransaction) {
            return undefined;
        }

        const interval = setInterval(() => {
            dispatch(fetchAndUpdateAccountThunk({ accountKey }));
        }, pollIntervalMs);

        return () => clearInterval(interval);
    }, [accountKey, dispatch, pollIntervalMs, shouldPollPendingTransaction]);

    useEffect(() => {
        if (txid && isTransactionConfirmed && networkSymbol) {
            markReviewNavigationSuccess();
            navigation.dispatch(
                navigateToPushedTransactionAction({
                    accountKey,
                    amountInBaseUnits,
                    failedTxid: isTransactionFailed ? txid : undefined,
                    stakeType,
                    symbol: networkSymbol,
                }),
            );
        }
    }, [
        accountKey,
        amountInBaseUnits,
        isTransactionConfirmed,
        isTransactionFailed,
        markReviewNavigationSuccess,
        navigation,
        networkSymbol,
        stakeType,
        txid,
    ]);

    useEffect(() => {
        if (!txid) return undefined;

        return () => {
            dispatch(sendFormActions.discardTransaction());
        };
    }, [txid, dispatch]);

    const trackPushedTransaction = useCallback((pushedTxid: string) => {
        setTxid(pushedTxid);
        setSubmittedAt(new Date());
    }, []);

    return {
        trackPushedTransaction,
        pendingTxid: txid || undefined,
        isPending: shouldPollPendingTransaction,
        submittedAt,
    };
};
