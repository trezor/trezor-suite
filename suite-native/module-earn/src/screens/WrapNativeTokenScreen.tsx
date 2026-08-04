import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';

import { selectIsDeviceConnected } from '@suite-common/device';
import { WRAPPED_NATIVE, getNetwork, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { WETH_WRAP_GAS_RESERVE } from '@suite-common/wallet-constants';
import {
    type AccountsRootState,
    type YieldPendingTransactionState,
    selectAccountByKey,
    shouldRecommendWrapReserve,
    useWrappedNativePendingTx,
} from '@suite-common/wallet-core';
import { toTokenSymbol } from '@suite-common/wallet-types';
import { Box, Button, FullAlertBox, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import {
    Screen,
    ScreenHeader,
    type StackNavigationProps,
    type WrappedNativeTokenStackParamList,
    WrappedNativeTokenStackRoutes,
} from '@suite-native/navigation';
import { FeeSelector } from '@suite-native/transaction-management';

import { YieldDepositAmountInputCard } from '../components/YieldDepositAmountInputCard';
import { YieldFeeEstimationErrorAlert } from '../components/YieldFeeEstimationErrorAlert';
import { YieldPendingTransactionModal } from '../components/YieldPendingTransactionModal';
import { YieldTxSimulationBottomSheet } from '../components/YieldTxSimulationBottomSheet';
import { useWrapNativeTokenFees } from '../hooks/useWrapNativeTokenFees';
import { useWrapNativeTokenForm } from '../hooks/useWrapNativeTokenForm';
import { useYieldPendingTransaction } from '../hooks/useYieldPendingTransaction';

type RouteProps = RouteProp<
    WrappedNativeTokenStackParamList,
    WrappedNativeTokenStackRoutes.WrapNativeToken
>;
type NavigationProps = StackNavigationProps<
    WrappedNativeTokenStackParamList,
    WrappedNativeTokenStackRoutes.WrapNativeToken
>;

type PreparedWrap = {
    amount: string;
    unsignedTransaction: string;
};

export const WrapNativeTokenScreen = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProps>();
    const isFocused = useIsFocused();
    const { accountKey, pendingTransaction: pendingParam } = route.params;

    const [isDeviceNotConnectedVisible, setIsDeviceNotConnectedVisible] = useState(false);
    const [hasWrapFailed, setHasWrapFailed] = useState(false);
    const [preparedWrap, setPreparedWrap] = useState<PreparedWrap | null>(null);

    const {
        bottomSheetRef: simulationBottomSheetRef,
        closeModal: closeSimulationBottomSheet,
        openModal: openSimulationBottomSheet,
    } = useBottomSheetModal();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const isDeviceConnected = useSelector(selectIsDeviceConnected);

    const wrappedNative = account ? WRAPPED_NATIVE[account.symbol] : undefined;
    const nativeSymbol = toTokenSymbol(account ? getNetworkDisplaySymbol(account.symbol) : '');

    const form = useWrapNativeTokenForm({
        availableBalance: account?.formattedBalance ?? '0',
        decimals: account ? getNetwork(account.symbol).decimals : 0,
        tokenSymbol: nativeSymbol,
    });
    const { amountValue, handleAmountChange, handleMaxChange, isMaxSelected } = form;
    const {
        formState: { isValid },
    } = form.form;

    const isWrapPending = !!pendingParam;
    const isWrapAmountReady = isValid && !!amountValue;

    const wrapFee = useWrapNativeTokenFees({
        account: account ?? null,
        amount: amountValue,
        isEnabled: isWrapAmountReady && !isWrapPending,
    });

    const pendingStatus = useWrappedNativePendingTx(
        account ?? null,
        pendingParam?.txid ?? null,
        'wrap',
    );
    const pendingTransaction: YieldPendingTransactionState | null = useMemo(
        () =>
            pendingParam
                ? {
                      type: 'wrap',
                      txid: pendingParam.txid,
                      amount: pendingParam.amount,
                      fee: pendingParam.fee,
                      submittedAt: pendingParam.submittedAt,
                  }
                : null,
        [pendingParam],
    );
    const { pendingBottomSheetRef, pendingModalProps } = useYieldPendingTransaction({
        accountKey,
        isFocused,
        pendingTransaction,
        transactionType: 'wrap',
    });

    useEffect(() => {
        if (!pendingParam) {
            return;
        }

        if (pendingStatus === 'confirmed') {
            navigation.replace(WrappedNativeTokenStackRoutes.WrapNativeTokenComplete, {
                accountKey,
                amount: pendingParam.amount,
                txid: pendingParam.txid,
            });

            return;
        }

        if (pendingStatus === 'failed') {
            setHasWrapFailed(true);
            navigation.setParams({ pendingTransaction: undefined });
        }
    }, [accountKey, navigation, pendingParam, pendingStatus]);

    const handleSubmit = useCallback(() => {
        const { preparedAction } = wrapFee;

        if (preparedAction?.amount !== amountValue) {
            return;
        }

        setHasWrapFailed(false);
        setPreparedWrap(preparedAction);
        requestAnimationFrame(openSimulationBottomSheet);
    }, [amountValue, openSimulationBottomSheet, wrapFee]);

    const handleConfirmSimulation = useCallback(() => {
        closeSimulationBottomSheet();

        if (!preparedWrap) {
            return;
        }

        if (!isDeviceConnected) {
            setIsDeviceNotConnectedVisible(true);

            return;
        }

        setIsDeviceNotConnectedVisible(false);
        navigation.navigate(WrappedNativeTokenStackRoutes.WrapNativeTokenReview, {
            accountKey,
            amount: preparedWrap.amount,
            unsignedTransaction: preparedWrap.unsignedTransaction,
        });
    }, [accountKey, closeSimulationBottomSheet, isDeviceConnected, navigation, preparedWrap]);

    const handleCancelSimulation = useCallback(() => {
        closeSimulationBottomSheet();
    }, [closeSimulationBottomSheet]);

    if (!account || !wrappedNative || account.networkType !== 'ethereum') {
        return null;
    }

    const accountLabel = account.accountLabel ?? getNetwork(account.symbol).name;
    const isReserveRecommended = shouldRecommendWrapReserve(
        amountValue ?? '',
        account.formattedBalance,
    );
    const isSubmitDisabled = !isWrapAmountReady || !wrapFee.isWrapFeeReady || isWrapPending;

    return (
        <Screen
            header={
                <ScreenHeader
                    closeActionType="back"
                    title={
                        <Translation
                            id="earn.wrapNativeToken.title"
                            values={{ nativeSymbol, wrappedSymbol: wrappedNative.symbol }}
                        />
                    }
                />
            }
        >
            <Box marginTop="sp16" pointerEvents={isWrapPending ? 'none' : 'auto'}>
                <VStack spacing="sp16">
                    <Form form={form.form}>
                        <YieldDepositAmountInputCard
                            amountLabel={<Translation id="earn.wrapNativeToken.amountToWrap" />}
                            balance={account.formattedBalance}
                            isMaxSelected={isMaxSelected}
                            onAmountChange={handleAmountChange}
                            onMaxChange={handleMaxChange}
                            tokenSymbol={nativeSymbol}
                        />
                    </Form>
                    {isReserveRecommended && (
                        <FullAlertBox
                            intent="info"
                            title={
                                <Translation
                                    id="earn.wrapNativeToken.reserveRecommendation"
                                    values={{
                                        amount: WETH_WRAP_GAS_RESERVE.toString(),
                                        nativeSymbol,
                                    }}
                                />
                            }
                        />
                    )}
                    {isWrapAmountReady &&
                        !isWrapPending &&
                        (wrapFee.hasFeeEstimationError ? (
                            <YieldFeeEstimationErrorAlert onRetry={wrapFee.retryFeeEstimation} />
                        ) : (
                            <FeeSelector
                                accountKey={account.key}
                                updateThunk={wrapFee.updateFeeLevelThunk}
                                selectedFee={wrapFee.selectedFee}
                                selectedFeePerUnit={wrapFee.formDraft?.feePerUnit}
                                formDraft={wrapFee.formDraft}
                                formDraftKey={wrapFee.formDraftKey}
                            />
                        ))}
                    {isDeviceNotConnectedVisible && (
                        <FullAlertBox
                            intent="critical"
                            title={
                                <Translation id="earn.wrapNativeToken.errors.deviceNotConnected" />
                            }
                        />
                    )}
                    {hasWrapFailed && (
                        <FullAlertBox
                            intent="critical"
                            title={<Translation id="earn.wrapNativeToken.complete.failedTitle" />}
                            description={
                                <Translation id="earn.wrapNativeToken.complete.failedSubtitle" />
                            }
                        />
                    )}
                    <Button
                        isDisabled={isSubmitDisabled}
                        onPress={handleSubmit}
                        testID="@wrap-native-token/submit-button"
                    >
                        <Translation id="earn.wrapNativeToken.submitButton" />
                    </Button>
                </VStack>
            </Box>
            {preparedWrap && (
                <YieldTxSimulationBottomSheet
                    ref={simulationBottomSheetRef}
                    account={account}
                    flow="wrap"
                    onCancel={handleCancelSimulation}
                    onConfirm={handleConfirmSimulation}
                    unsignedTx={preparedWrap.unsignedTransaction}
                />
            )}
            {pendingParam && pendingModalProps && (
                <YieldPendingTransactionModal
                    ref={pendingBottomSheetRef}
                    accountLabel={accountLabel}
                    accountSymbol={account.symbol}
                    amount={pendingParam.amount}
                    amountLabel={<Translation id="earn.wrapNativeToken.amountToWrap" />}
                    amountTokenSymbol={nativeSymbol}
                    fee={pendingModalProps.fee}
                    isExploreDisabled={pendingModalProps.isExploreDisabled}
                    onExplorePress={pendingModalProps.onExplorePress}
                    submittedAt={pendingModalProps.submittedAt}
                    title={<Translation id="earn.wrapNativeToken.pendingTransactionTitle" />}
                />
            )}
        </Screen>
    );
};
