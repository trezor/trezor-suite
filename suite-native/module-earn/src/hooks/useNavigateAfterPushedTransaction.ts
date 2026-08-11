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

import { resolveStakingTargetRoute } from '../utils/resolveStakingTargetRoute';

type NavigationProps = StackNavigationProps<RootStackParamList, RootStackRoutes>;

const navigateToPushedTransactionAction = ({
    accountKey,
    symbol,
    txid,
}: {
    accountKey: AccountKey;
    symbol: NetworkSymbol;
    txid: string;
}) =>
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
            {
                name: RootStackRoutes.TransactionDetailStack,
                params: {
                    screen: TransactionDetailStackRoutes.TransactionDetail,
                    params: {
                        accountKey,
                        txid,
                        closeActionType: 'close',
                    },
                },
            },
        ],
    });

type UseNavigateAfterPushedTransactionParams = {
    accountKey: AccountKey;
    markReviewNavigationSuccess: () => void;
};

export const useNavigateAfterPushedTransaction = ({
    accountKey,
    markReviewNavigationSuccess,
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
                navigateToPushedTransactionAction({ accountKey, symbol: networkSymbol, txid }),
            );
        }
    }, [
        accountKey,
        isTransactionConfirmed,
        markReviewNavigationSuccess,
        navigation,
        networkSymbol,
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
