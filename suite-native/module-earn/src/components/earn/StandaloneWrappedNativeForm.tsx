import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { events } from '@suite-common/analytics';
import { Context } from '@suite-common/message-system';
import { getNetwork, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { WETH_WRAP_GAS_RESERVE } from '@suite-common/wallet-constants';
import {
    type AccountsRootState,
    type WrappedNativeFlowType,
    getMaxWrapAmount,
    selectAccountByKey,
    shouldRecommendWrapReserve,
} from '@suite-common/wallet-core';
import { toTokenAddress, toTokenSymbol } from '@suite-common/wallet-types';
import { BannerFull, Box, Button, VStack } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { ContextMessage } from '@suite-native/message-system';
import {
    Screen,
    type WrappedNativeTokenStackParamList,
    type WrappedNativeTokenStackRoutes,
} from '@suite-native/navigation';
import { getWrappedNativeToken } from '@trezor/network-ethereum-suite-common';

import { WrappedNativeTokenAmountInputCard } from './WrappedNativeTokenAmountInputCard';
import { useMessageSystemWrappedNative } from '../../hooks/earn/useMessageSystemWrappedNative';
import { useNavigateBackAnalytics } from '../../hooks/earn/useNavigateBackAnalytics';
import { useStandaloneWrappedNativeFlow } from '../../hooks/earn/useStandaloneWrappedNativeFlow';
import { useWrappedNativeTokenFees } from '../../hooks/earn/useWrappedNativeTokenFees';
import { useWrappedNativeTokenForm } from '../../hooks/earn/useWrappedNativeTokenForm';
import { useYieldCurrencyToggleAnalytics } from '../../hooks/yield/useYieldCurrencyToggleAnalytics';
import { getAccountTokenByContract } from '../../utils/earn/contractTokenBalanceUtils';
import { wrappedNativeFlowMessages } from '../../utils/earn/wrappedNativeFlowMessages';
import { YieldDepositFlowScreenHeader } from '../yield/YieldDepositFlowScreenHeader';
import { YieldDisabledAlert } from '../yield/YieldDisabledAlert';
import { YieldFeeSection } from '../yield/YieldFeeSection';
import { YieldPendingTransactionModal } from '../yield/YieldPendingTransactionModal';
import { YieldTxSimulationBottomSheet } from '../yield/YieldTxSimulationBottomSheet';

type RouteProps = RouteProp<
    WrappedNativeTokenStackParamList,
    WrappedNativeTokenStackRoutes.WrapNativeToken | WrappedNativeTokenStackRoutes.UnwrapNativeToken
>;

type StandaloneWrappedNativeFormProps = {
    flowType: WrappedNativeFlowType;
};

export const StandaloneWrappedNativeForm = ({ flowType }: StandaloneWrappedNativeFormProps) => {
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

    const {
        isDisabled: isFlowDisabled,
        content: flowDisabledContent,
        variant: flowDisabledVariant,
    } = useMessageSystemWrappedNative(flowType);

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
        isDisabled: isFlowDisabled,
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
        return null;
    }

    const messages = wrappedNativeFlowMessages[flowType].form;
    const accountLabel = account.accountLabel ?? getNetwork(account.symbol).name;
    // An unwrap spends the token, so its contract flows into the amount input, fee section and
    // pending modal; a wrap spends the native coin and leaves them contract-less.
    const spentTokenContract = isWrap ? undefined : toTokenAddress(wrappedNative.address);
    const isReserveRecommended =
        isWrap && shouldRecommendWrapReserve(amountValue ?? '', account.formattedBalance);
    const isSubmitDisabled = !isAmountReady || !fees.isFeeReady || isFlowPending || isFlowDisabled;

    return (
        <Screen
            header={
                <YieldDepositFlowScreenHeader
                    account={account}
                    closeActionType="back"
                    title={
                        <Translation
                            id={messages.title}
                            values={{ nativeSymbol, wrappedSymbol: wrappedNative.symbol }}
                        />
                    }
                    tokenContract={toTokenAddress(wrappedNative.address)}
                />
            }
        >
            <Box marginTop="sp16" pointerEvents={isFlowPending ? 'none' : 'auto'}>
                <VStack spacing="sp16">
                    <ContextMessage context={Context.getWrappedNative(flowType)} />
                    {isFlowDisabled && (
                        <YieldDisabledAlert
                            type={flowType}
                            content={flowDisabledContent}
                            variant={flowDisabledVariant}
                        />
                    )}
                    <Form form={form.form}>
                        <WrappedNativeTokenAmountInputCard
                            amountLabel={<Translation id={messages.amountLabel} />}
                            balance={spentBalance}
                            maxAmount={
                                isWrap ? getMaxWrapAmount(account.formattedBalance) : undefined
                            }
                            onCurrencyChange={reportCurrencyToggle}
                            onMaxPress={flow.reportMaxSelected}
                            symbol={account.symbol}
                            tokenContract={spentTokenContract}
                            tokenDecimals={isWrap ? undefined : wrappedNative.decimals}
                            tokenSymbol={spentSymbol}
                        />
                    </Form>
                    {isReserveRecommended && (
                        <BannerFull
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
                        <YieldFeeSection
                            accountKey={account.key}
                            fees={fees}
                            tokenContract={spentTokenContract}
                        />
                    )}
                    {flow.isDeviceNotConnectedVisible && (
                        <BannerFull
                            intent="critical"
                            title={<Translation id={messages.deviceNotConnectedError} />}
                        />
                    )}
                    {flow.isFirmwareOutdatedVisible && (
                        <BannerFull
                            intent="critical"
                            title={<Translation id="earn.wrappedNativeToken.firmwareOutdated" />}
                        />
                    )}
                    {flow.hasFlowFailed && (
                        <BannerFull
                            intent="critical"
                            title={<Translation id={messages.failedTitle} />}
                            description={<Translation id={messages.failedSubtitle} />}
                        />
                    )}
                    <Button
                        isDisabled={isSubmitDisabled}
                        onPress={flow.handleSubmit}
                        testID={`@${flowType}-native-token/submit-button`}
                    >
                        <Translation id={messages.submitButton} />
                    </Button>
                </VStack>
            </Box>
            {flow.preparedTx && (
                <YieldTxSimulationBottomSheet
                    ref={flow.simulationBottomSheetRef}
                    account={account}
                    flow={flowType}
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
                    amountLabel={<Translation id={messages.amountLabel} />}
                    amountTokenContract={spentTokenContract}
                    amountTokenSymbol={spentSymbol}
                    fee={flow.pendingModalProps.fee}
                    isExploreDisabled={flow.pendingModalProps.isExploreDisabled}
                    onExplorePress={flow.pendingModalProps.onExplorePress}
                    submittedAt={flow.pendingModalProps.submittedAt}
                    txid={flow.pendingModalProps.txid}
                    title={<Translation id={messages.pendingTransactionTitle} />}
                />
            )}
        </Screen>
    );
};
