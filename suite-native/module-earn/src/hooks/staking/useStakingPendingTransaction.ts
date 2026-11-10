import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { CommonActions, useIsFocused, useNavigation } from '@react-navigation/native';
import { useAtomValue } from 'jotai';

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
import { alertAtom, useAlert } from '@suite-native/alerts';
import { useTranslate } from '@suite-native/intl';
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

const MISSING_TRANSACTION_GRACE_MS = 2 * 60 * 1000;

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
    const isFocused = useIsFocused();
    const { showAlert, hideAlert } = useAlert();
    const alert = useAtomValue(alertAtom);
    const hasOtherAlert = !!alert && alert.type !== 'stakingTransactionNotConfirmed';
    const { translate } = useTranslate();
    const txid = pendingTransaction?.txid;
    const amountInBaseUnits = pendingTransaction?.amountInBaseUnits;
    const submittedAt = pendingTransaction?.submittedAt;
    const notifiedTxidRef = useRef<string | undefined>(undefined);
    const [overdueTxid, setOverdueTxid] = useState(() =>
        submittedAt !== undefined && submittedAt + MISSING_TRANSACTION_GRACE_MS <= Date.now()
            ? txid
            : undefined,
    );

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
    const isAwaitingConfirmation = !!txid && !isTransactionConfirmed;
    const isDropped = isAwaitingConfirmation && !transaction && overdueTxid === txid;
    const isPending = isAwaitingConfirmation && !isDropped;
    const pollIntervalMs = getPollIntervalMs(feeInfo?.blockTime);

    useEffect(() => {
        if (!isAwaitingConfirmation) return undefined;

        const interval = setInterval(() => {
            dispatch(fetchAndUpdateAccountThunk({ accountKey }));
        }, pollIntervalMs);

        return () => clearInterval(interval);
    }, [accountKey, dispatch, isAwaitingConfirmation, pollIntervalMs]);

    useEffect(() => {
        if (!txid || submittedAt === undefined) return undefined;

        const timeout = setTimeout(
            () => setOverdueTxid(txid),
            Math.max(submittedAt + MISSING_TRANSACTION_GRACE_MS - Date.now(), 0),
        );

        return () => clearTimeout(timeout);
    }, [submittedAt, txid]);

    useEffect(() => {
        if (!isDropped || !isFocused || hasOtherAlert || notifiedTxidRef.current === txid)
            return undefined;

        notifiedTxidRef.current = txid;

        showAlert({
            type: 'stakingTransactionNotConfirmed',
            title: translate('earn.transactionNotConfirmedAlert.title'),
            description: translate('earn.transactionNotConfirmedAlert.description'),
            pictogramVariant: 'warning',
            primaryButtonTitle: translate('generic.buttons.gotIt'),
            onPressPrimaryButton: () => hideAlert('stakingTransactionNotConfirmed'),
        });

        return () => hideAlert('stakingTransactionNotConfirmed');
    }, [hasOtherAlert, hideAlert, isDropped, isFocused, showAlert, translate, txid]);

    useEffect(() => {
        if (!txid || amountInBaseUnits === undefined || !isTransactionConfirmed || !isFocused)
            return;

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
        isFocused,
        isTransactionConfirmed,
        isTransactionFailed,
        navigation,
        stakeType,
        txid,
    ]);

    const { pendingBottomSheetRef, isExploreDisabled, openInBlockchain } =
        useEarnPendingTransactionSheet({
            accountKey,
            isPending: isPending && isFocused,
            pendingTxid: txid,
        });

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
