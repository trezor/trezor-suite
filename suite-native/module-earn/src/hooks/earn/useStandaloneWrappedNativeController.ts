import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { events } from '@suite-common/analytics';
import { getNetwork, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type WrappedNativeFlowType,
    getMaxWrapAmount,
    selectAccountByKey,
    shouldRecommendWrapReserve,
} from '@suite-common/wallet-core';
import { toTokenAddress, toTokenSymbol } from '@suite-common/wallet-types';
import {
    type WrappedNativeTokenStackParamList,
    type WrappedNativeTokenStackRoutes,
} from '@suite-native/navigation';
import { getWrappedNativeToken } from '@trezor/network-ethereum-suite-common';

import { useMessageSystemWrappedNative } from './useMessageSystemWrappedNative';
import { useNavigateBackAnalytics } from './useNavigateBackAnalytics';
import { useStandaloneWrappedNativeFlow } from './useStandaloneWrappedNativeFlow';
import { useWrappedNativeTokenFees } from './useWrappedNativeTokenFees';
import { useWrappedNativeTokenForm } from './useWrappedNativeTokenForm';
import { getAccountTokenByContract } from '../../utils/earn/contractTokenBalanceUtils';
import { useYieldCurrencyToggleAnalytics } from '../yield/useYieldCurrencyToggleAnalytics';

type RouteProps = RouteProp<
    WrappedNativeTokenStackParamList,
    WrappedNativeTokenStackRoutes.WrapNativeToken | WrappedNativeTokenStackRoutes.UnwrapNativeToken
>;

export const useStandaloneWrappedNativeController = (flowType: WrappedNativeFlowType) => {
    const route = useRoute<RouteProps>();
    const { accountKey, pendingTransaction } = route.params;
    const isWrap = flowType === 'wrap';

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const wrappedNative = account ? getWrappedNativeToken(account.symbol) : undefined;
    const nativeSymbol = toTokenSymbol(account ? getNetworkDisplaySymbol(account.symbol) : '');
    const wrappedBalance =
        account && wrappedNative
            ? (getAccountTokenByContract(account, wrappedNative.address)?.balance ?? '0')
            : '0';

    const nativeDecimals = account ? getNetwork(account.symbol).decimals : 0;
    const spentBalance = isWrap ? (account?.formattedBalance ?? '0') : wrappedBalance;
    const spentDecimals = isWrap ? nativeDecimals : (wrappedNative?.decimals ?? 0);
    const spentSymbol = isWrap ? nativeSymbol : toTokenSymbol(wrappedNative?.symbol ?? '');

    const messageSystem = useMessageSystemWrappedNative(flowType);

    const form = useWrappedNativeTokenForm({
        availableBalance: spentBalance,
        decimals: spentDecimals,
        tokenSymbol: spentSymbol,
    });
    const { amountValue } = form;
    const {
        formState: { isValid },
    } = form.form;

    const isAmountReady = isValid && !!amountValue;
    const isFlowPending = !!pendingTransaction;
    const isFeeSectionDisplayed = isAmountReady && !isFlowPending;

    const fees = useWrappedNativeTokenFees({
        account: account ?? null,
        amount: amountValue,
        flowType,
        isEnabled: isFeeSectionDisplayed,
    });

    const flow = useStandaloneWrappedNativeFlow({
        account: account ?? null,
        accountKey,
        amountValue,
        flowType,
        isDisabled: messageSystem.isDisabled,
        pendingParam: pendingTransaction,
        preparedAction: fees.preparedAction,
    });

    const reportCurrencyToggle = useYieldCurrencyToggleAnalytics({
        networkSymbol: account?.symbol,
    });

    useNavigateBackAnalytics({
        type: events.yieldNavigateEvent.name,
        payload: {
            action: 'cancel',
            from: isWrap ? 'wrap-form' : 'unwrap-form',
            to: 'account-detail',
            networkSymbol: account?.symbol,
        },
    });

    if (!account || !wrappedNative || account.networkType !== 'ethereum') {
        return { status: 'loading' as const };
    }

    const spentTokenContract = isWrap ? undefined : toTokenAddress(wrappedNative.address);

    return {
        status: 'ready' as const,
        account,
        accountLabel: account.accountLabel ?? getNetwork(account.symbol).name,
        nativeSymbol,
        wrappedTokenSymbol: wrappedNative.symbol,
        wrappedTokenContract: toTokenAddress(wrappedNative.address),
        spentSymbol,
        spentTokenContract,
        isInteractionBlocked: isFlowPending,
        disabledAlert: messageSystem.isDisabled
            ? { content: messageSystem.content, variant: messageSystem.variant }
            : null,
        form,
        amountInput: {
            balance: spentBalance,
            maxAmount: isWrap ? getMaxWrapAmount(account.formattedBalance) : undefined,
            tokenDecimals: isWrap ? undefined : wrappedNative.decimals,
            onCurrencyChange: reportCurrencyToggle,
            onMaxPress: flow.reportMaxSelected,
        },
        isReserveRecommended:
            isWrap && shouldRecommendWrapReserve(amountValue ?? '', account.formattedBalance),
        isDeviceNotConnectedVisible: flow.isDeviceNotConnectedVisible,
        isFirmwareOutdatedVisible: flow.isFirmwareOutdatedVisible,
        hasFlowFailed: flow.hasFlowFailed,
        feeSection: {
            isVisible: isFeeSectionDisplayed,
            fees,
        },
        submit: {
            isDisabled:
                !isAmountReady || !fees.isFeeReady || isFlowPending || messageSystem.isDisabled,
            onPress: flow.handleSubmit,
        },
        pendingModal:
            pendingTransaction && flow.pendingModalProps
                ? {
                      pendingTransaction,
                      modalProps: flow.pendingModalProps,
                      bottomSheetRef: flow.pendingBottomSheetRef,
                  }
                : null,
        simulationSheet: flow.preparedTx
            ? {
                  bottomSheetRef: flow.simulationBottomSheetRef,
                  unsignedTransaction: flow.preparedTx.unsignedTransaction,
                  onConfirm: flow.handleConfirmSimulation,
                  onCancel: flow.handleCancelSimulation,
              }
            : null,
    };
};
