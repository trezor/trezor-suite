import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { Context } from '@suite-common/message-system';
import { WRAPPED_NATIVE, getNetwork, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { WETH_WRAP_GAS_RESERVE } from '@suite-common/wallet-constants';
import {
    type AccountsRootState,
    getMaxWrapAmount,
    selectAccountByKey,
    shouldRecommendWrapReserve,
} from '@suite-common/wallet-core';
import { toTokenAddress, toTokenSymbol } from '@suite-common/wallet-types';
import { Box, Button, FullAlertBox, VStack } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { ContextMessage } from '@suite-native/message-system';
import {
    Screen,
    type WrappedNativeTokenStackParamList,
    type WrappedNativeTokenStackRoutes,
} from '@suite-native/navigation';

import { WrappedNativeTokenAmountInputCard } from '../components/WrappedNativeTokenAmountInputCard';
import { YieldDepositFlowScreenHeader } from '../components/YieldDepositFlowScreenHeader';
import { YieldDisabledAlert } from '../components/YieldDisabledAlert';
import { YieldFeeSection } from '../components/YieldFeeSection';
import { YieldPendingTransactionModal } from '../components/YieldPendingTransactionModal';
import { YieldTxSimulationBottomSheet } from '../components/YieldTxSimulationBottomSheet';
import { useMessageSystemWrappedNative } from '../hooks/useMessageSystemWrappedNative';
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

    const {
        isDisabled: isWrapDisabled,
        content: wrapDisabledContent,
        variant: wrapDisabledVariant,
    } = useMessageSystemWrappedNative('wrap');

    const form = useWrappedNativeTokenForm({
        availableBalance: account?.formattedBalance ?? '0',
        decimals: account ? getNetwork(account.symbol).decimals : 0,
        tokenSymbol: nativeSymbol,
    });
    const { amountValue } = form;
    const {
        formState: { isValid },
    } = form.form;

    const isWrapAmountReady = isValid && !!amountValue;
    const isWrapPending = !!pendingTransaction;
    const isFeeSectionDisplayed = isWrapAmountReady && !isWrapPending;

    const wrapFee = useWrappedNativeTokenFees({
        account: account ?? null,
        amount: amountValue,
        flowType: 'wrap',
        isEnabled: isFeeSectionDisplayed,
    });

    const flow = useStandaloneWrappedNativeFlow({
        account: account ?? null,
        accountKey,
        amountValue,
        flowType: 'wrap',
        isDisabled: isWrapDisabled,
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
    const isSubmitDisabled =
        !isWrapAmountReady || !wrapFee.isFeeReady || isWrapPending || isWrapDisabled;

    return (
        <Screen
            header={
                <YieldDepositFlowScreenHeader
                    account={account}
                    closeActionType="back"
                    title={
                        <Translation
                            id="earn.wrapNativeToken.title"
                            values={{ nativeSymbol, wrappedSymbol: wrappedNative.symbol }}
                        />
                    }
                    tokenContract={toTokenAddress(wrappedNative.address)}
                />
            }
        >
            <Box marginTop="sp16" pointerEvents={isWrapPending ? 'none' : 'auto'}>
                <VStack spacing="sp16">
                    <ContextMessage context={Context.getWrappedNative('wrap')} />
                    {isWrapDisabled && (
                        <YieldDisabledAlert
                            type="wrap"
                            content={wrapDisabledContent}
                            variant={wrapDisabledVariant}
                        />
                    )}
                    <Form form={form.form}>
                        <WrappedNativeTokenAmountInputCard
                            amountLabel={<Translation id="earn.wrapNativeToken.amountToWrap" />}
                            balance={account.formattedBalance}
                            maxAmount={getMaxWrapAmount(account.formattedBalance)}
                            symbol={account.symbol}
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
                    {isFeeSectionDisplayed && (
                        <YieldFeeSection accountKey={account.key} fees={wrapFee} />
                    )}
                    {flow.isDeviceNotConnectedVisible && (
                        <FullAlertBox
                            intent="critical"
                            title={
                                <Translation id="earn.wrapNativeToken.errors.deviceNotConnected" />
                            }
                        />
                    )}
                    {flow.isFirmwareOutdatedVisible && (
                        <FullAlertBox
                            intent="critical"
                            title={<Translation id="earn.wrappedNativeToken.firmwareOutdated" />}
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
