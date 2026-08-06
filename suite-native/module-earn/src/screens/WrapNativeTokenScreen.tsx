import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { WRAPPED_NATIVE, getNetwork, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { WETH_WRAP_GAS_RESERVE } from '@suite-common/wallet-constants';
import {
    type AccountsRootState,
    getWrappableNativeBalance,
    selectAccountByKey,
    shouldRecommendWrapReserve,
} from '@suite-common/wallet-core';
import { toTokenSymbol } from '@suite-common/wallet-types';
import { Box, Button, FullAlertBox, VStack } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import {
    Screen,
    ScreenHeader,
    type WrappedNativeTokenStackParamList,
    type WrappedNativeTokenStackRoutes,
} from '@suite-native/navigation';
import { FeeSelector } from '@suite-native/transaction-management';

import { YieldDepositAmountInputCard } from '../components/YieldDepositAmountInputCard';
import { YieldFeeEstimationErrorAlert } from '../components/YieldFeeEstimationErrorAlert';
import { YieldPendingTransactionModal } from '../components/YieldPendingTransactionModal';
import { YieldTxSimulationBottomSheet } from '../components/YieldTxSimulationBottomSheet';
import { useStandaloneWrappedNativeFlow } from '../hooks/useStandaloneWrappedNativeFlow';
import { useWrappedNativeTokenFees } from '../hooks/useWrappedNativeTokenFees';
import { useWrappedNativeTokenForm } from '../hooks/useWrappedNativeTokenForm';

type RouteProps = RouteProp<
    WrappedNativeTokenStackParamList,
    WrappedNativeTokenStackRoutes.WrapNativeToken
>;

export const WrapNativeTokenScreen = () => {
    const route = useRoute<RouteProps>();
    const { accountKey, pendingTransaction } = route.params;

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const wrappedNative = account ? WRAPPED_NATIVE[account.symbol] : undefined;
    const nativeSymbol = toTokenSymbol(account ? getNetworkDisplaySymbol(account.symbol) : '');

    const form = useWrappedNativeTokenForm({
        availableBalance: account?.formattedBalance ?? '0',
        decimals: account ? getNetwork(account.symbol).decimals : 0,
        // Max leaves the gas reserve aside; the field still accepts up to the full balance and
        // eating into the reserve only triggers a non-blocking recommendation.
        maxAmount: getWrappableNativeBalance(account?.formattedBalance ?? '0'),
        tokenSymbol: nativeSymbol,
    });
    const { amountValue, handleAmountChange, handleMaxChange, isMaxSelected } = form;
    const {
        formState: { isValid },
    } = form.form;

    const isWrapAmountReady = isValid && !!amountValue;
    const isWrapPending = !!pendingTransaction;

    const wrapFee = useWrappedNativeTokenFees({
        account: account ?? null,
        amount: amountValue,
        flowType: 'wrap',
        isEnabled: isWrapAmountReady && !isWrapPending,
    });

    const flow = useStandaloneWrappedNativeFlow({
        account: account ?? null,
        accountKey,
        amountValue,
        flowType: 'wrap',
        pendingParam: pendingTransaction,
        preparedAction: wrapFee.preparedAction,
    });

    if (!account || !wrappedNative || account.networkType !== 'ethereum') {
        return null;
    }

    const accountLabel = account.accountLabel ?? getNetwork(account.symbol).name;
    const isReserveRecommended = shouldRecommendWrapReserve(
        amountValue ?? '',
        account.formattedBalance,
    );
    const isSubmitDisabled = !isWrapAmountReady || !wrapFee.isFeeReady || flow.isPending;

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
            <Box marginTop="sp16" pointerEvents={flow.isPending ? 'none' : 'auto'}>
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
                        !flow.isPending &&
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
                    {flow.isDeviceNotConnectedVisible && (
                        <FullAlertBox
                            intent="critical"
                            title={
                                <Translation id="earn.wrapNativeToken.errors.deviceNotConnected" />
                            }
                        />
                    )}
                    {flow.hasFlowFailed && (
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
                        onPress={flow.handleSubmit}
                        testID="@wrap-native-token/submit-button"
                    >
                        <Translation id="earn.wrapNativeToken.submitButton" />
                    </Button>
                </VStack>
            </Box>
            {flow.preparedTx && (
                <YieldTxSimulationBottomSheet
                    ref={flow.simulationBottomSheetRef}
                    account={account}
                    flow="wrap"
                    onCancel={flow.handleCancelSimulation}
                    onConfirm={flow.handleConfirmSimulation}
                    unsignedTx={flow.preparedTx.unsignedTransaction}
                />
            )}
            {pendingTransaction && flow.pendingModalProps && (
                <YieldPendingTransactionModal
                    ref={flow.pendingBottomSheetRef}
                    accountLabel={accountLabel}
                    accountSymbol={account.symbol}
                    amount={pendingTransaction.amount}
                    amountLabel={<Translation id="earn.wrapNativeToken.amountToWrap" />}
                    amountTokenSymbol={nativeSymbol}
                    fee={flow.pendingModalProps.fee}
                    isExploreDisabled={flow.pendingModalProps.isExploreDisabled}
                    onExplorePress={flow.pendingModalProps.onExplorePress}
                    submittedAt={flow.pendingModalProps.submittedAt}
                    title={<Translation id="earn.wrapNativeToken.pendingTransactionTitle" />}
                />
            )}
        </Screen>
    );
};
