import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';

import { selectIsDeviceConnected } from '@suite-common/device';
import { WRAPPED_NATIVE, getNetwork } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type YieldPendingTransactionState,
    selectAccountByKey,
    useWrappedNativePendingTx,
} from '@suite-common/wallet-core';
import { toTokenAddress, toTokenSymbol } from '@suite-common/wallet-types';
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
import { YieldDisabledAlert } from '../components/YieldDisabledAlert';
import { YieldFeeEstimationErrorAlert } from '../components/YieldFeeEstimationErrorAlert';
import { YieldPendingTransactionModal } from '../components/YieldPendingTransactionModal';
import { YieldTxSimulationBottomSheet } from '../components/YieldTxSimulationBottomSheet';
import { useMessageSystemWrappedNative } from '../hooks/useMessageSystemWrappedNative';
import { useWrappedNativeTokenFees } from '../hooks/useWrappedNativeTokenFees';
import { useWrappedNativeTokenForm } from '../hooks/useWrappedNativeTokenForm';
import { useYieldPendingTransaction } from '../hooks/useYieldPendingTransaction';
import { getAccountTokenByContract } from '../utils/contractTokenBalanceUtils';

type RouteProps = RouteProp<
    WrappedNativeTokenStackParamList,
    WrappedNativeTokenStackRoutes.UnwrapNativeToken
>;
type NavigationProps = StackNavigationProps<
    WrappedNativeTokenStackParamList,
    WrappedNativeTokenStackRoutes.UnwrapNativeToken
>;

type PreparedUnwrap = {
    amount: string;
    unsignedTransaction: string;
};

export const UnwrapNativeTokenScreen = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProps>();
    const isFocused = useIsFocused();
    const { accountKey, pendingTransaction: pendingParam } = route.params;

    const [isDeviceNotConnectedVisible, setIsDeviceNotConnectedVisible] = useState(false);
    const [hasUnwrapFailed, setHasUnwrapFailed] = useState(false);
    const [preparedUnwrap, setPreparedUnwrap] = useState<PreparedUnwrap | null>(null);

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
    const wrappedBalance =
        account && wrappedNative
            ? (getAccountTokenByContract(account, wrappedNative.address)?.balance ?? '0')
            : '0';

    const {
        isDisabled: isUnwrapDisabled,
        content: unwrapDisabledContent,
        variant: unwrapDisabledVariant,
    } = useMessageSystemWrappedNative('unwrap');

    const form = useWrappedNativeTokenForm({
        availableBalance: wrappedBalance,
        decimals: wrappedNative?.decimals ?? 0,
        tokenSymbol: wrappedNative?.symbol ?? '',
    });
    const { amountValue, handleAmountChange, handleMaxChange, isMaxSelected } = form;
    const {
        formState: { isValid },
    } = form.form;

    const isUnwrapPending = !!pendingParam;
    const isUnwrapAmountReady = isValid && !!amountValue;

    const unwrapFee = useWrappedNativeTokenFees({
        account: account ?? null,
        amount: amountValue,
        flowType: 'unwrap',
        isEnabled: isUnwrapAmountReady && !isUnwrapPending,
    });

    const pendingStatus = useWrappedNativePendingTx(
        account ?? null,
        pendingParam?.txid ?? null,
        'unwrap',
    );
    const pendingTransaction: YieldPendingTransactionState | null = useMemo(
        () =>
            pendingParam
                ? {
                      type: 'unwrap',
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
        transactionType: 'unwrap',
    });

    useEffect(() => {
        if (!pendingParam) {
            return;
        }

        if (pendingStatus === 'confirmed') {
            navigation.replace(WrappedNativeTokenStackRoutes.UnwrapNativeTokenComplete, {
                accountKey,
                amount: pendingParam.amount,
                txid: pendingParam.txid,
            });

            return;
        }

        if (pendingStatus === 'failed') {
            setHasUnwrapFailed(true);
            navigation.setParams({ pendingTransaction: undefined });
        }
    }, [accountKey, navigation, pendingStatus, pendingParam]);

    const handleSubmit = useCallback(() => {
        const { preparedAction } = unwrapFee;

        if (preparedAction?.amount !== amountValue) {
            return;
        }

        setHasUnwrapFailed(false);
        setPreparedUnwrap(preparedAction);
        requestAnimationFrame(openSimulationBottomSheet);
    }, [amountValue, openSimulationBottomSheet, unwrapFee]);

    const handleConfirmSimulation = useCallback(() => {
        closeSimulationBottomSheet();

        if (!preparedUnwrap) {
            return;
        }

        if (!isDeviceConnected) {
            setIsDeviceNotConnectedVisible(true);

            return;
        }

        setIsDeviceNotConnectedVisible(false);
        navigation.navigate(WrappedNativeTokenStackRoutes.UnwrapNativeTokenReview, {
            accountKey,
            amount: preparedUnwrap.amount,
            unsignedTransaction: preparedUnwrap.unsignedTransaction,
        });
    }, [accountKey, closeSimulationBottomSheet, isDeviceConnected, navigation, preparedUnwrap]);

    const handleCancelSimulation = useCallback(() => {
        closeSimulationBottomSheet();
    }, [closeSimulationBottomSheet]);

    if (!account || !wrappedNative || account.networkType !== 'ethereum') {
        return null;
    }

    const accountLabel = account.accountLabel ?? getNetwork(account.symbol).name;
    const wrappedTokenSymbol = toTokenSymbol(wrappedNative.symbol);
    const isSubmitDisabled =
        !isUnwrapAmountReady || !unwrapFee.isFeeReady || isUnwrapPending || isUnwrapDisabled;

    return (
        <Screen
            header={
                <ScreenHeader
                    closeActionType="back"
                    title={<Translation id="earn.unwrapNativeToken.title" />}
                />
            }
        >
            <Box marginTop="sp16" pointerEvents={isUnwrapPending ? 'none' : 'auto'}>
                <VStack spacing="sp16">
                    {isUnwrapDisabled && (
                        <YieldDisabledAlert
                            type="unwrap"
                            content={unwrapDisabledContent}
                            variant={unwrapDisabledVariant}
                        />
                    )}
                    <Form form={form.form}>
                        <YieldDepositAmountInputCard
                            amountLabel={<Translation id="earn.unwrapNativeToken.amountToUnwrap" />}
                            balance={wrappedBalance}
                            isMaxSelected={isMaxSelected}
                            onAmountChange={handleAmountChange}
                            onMaxChange={handleMaxChange}
                            tokenSymbol={wrappedTokenSymbol}
                        />
                    </Form>
                    {isUnwrapAmountReady &&
                        !isUnwrapPending &&
                        (unwrapFee.hasFeeEstimationError ? (
                            <YieldFeeEstimationErrorAlert onRetry={unwrapFee.retryFeeEstimation} />
                        ) : (
                            <FeeSelector
                                accountKey={account.key}
                                tokenContract={toTokenAddress(wrappedNative.address)}
                                updateThunk={unwrapFee.updateFeeLevelThunk}
                                selectedFee={unwrapFee.selectedFee}
                                selectedFeePerUnit={unwrapFee.formDraft?.feePerUnit}
                                formDraft={unwrapFee.formDraft}
                                formDraftKey={unwrapFee.formDraftKey}
                            />
                        ))}
                    {isDeviceNotConnectedVisible && (
                        <FullAlertBox
                            intent="critical"
                            title={
                                <Translation id="earn.unwrapNativeToken.errors.deviceNotConnected" />
                            }
                        />
                    )}
                    {hasUnwrapFailed && (
                        <FullAlertBox
                            intent="critical"
                            title={<Translation id="earn.unwrapNativeToken.complete.failedTitle" />}
                            description={
                                <Translation id="earn.unwrapNativeToken.complete.failedSubtitle" />
                            }
                        />
                    )}
                    <Button
                        isDisabled={isSubmitDisabled}
                        onPress={handleSubmit}
                        testID="@unwrap-native-token/submit-button"
                    >
                        <Translation id="earn.unwrapNativeToken.submitButton" />
                    </Button>
                </VStack>
            </Box>
            {preparedUnwrap && (
                <YieldTxSimulationBottomSheet
                    ref={simulationBottomSheetRef}
                    account={account}
                    flow="unwrap"
                    onCancel={handleCancelSimulation}
                    onConfirm={handleConfirmSimulation}
                    unsignedTx={preparedUnwrap.unsignedTransaction}
                />
            )}
            {pendingParam && pendingModalProps && (
                <YieldPendingTransactionModal
                    ref={pendingBottomSheetRef}
                    accountLabel={accountLabel}
                    accountSymbol={account.symbol}
                    amount={pendingParam.amount}
                    amountLabel={<Translation id="earn.unwrapNativeToken.amountToUnwrap" />}
                    amountTokenContract={toTokenAddress(wrappedNative.address)}
                    amountTokenSymbol={wrappedTokenSymbol}
                    fee={pendingModalProps.fee}
                    isExploreDisabled={pendingModalProps.isExploreDisabled}
                    onExplorePress={pendingModalProps.onExplorePress}
                    submittedAt={pendingModalProps.submittedAt}
                    title={<Translation id="earn.unwrapNativeToken.pendingTransactionTitle" />}
                />
            )}
        </Screen>
    );
};
