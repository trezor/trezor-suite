import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { events } from '@suite-common/analytics';
import { Context } from '@suite-common/message-system';
import { WRAPPED_NATIVE, getNetwork, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
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

import { WrappedNativeTokenAmountInputCard } from '../components/WrappedNativeTokenAmountInputCard';
import { YieldDepositFlowScreenHeader } from '../components/YieldDepositFlowScreenHeader';
import { YieldDisabledAlert } from '../components/YieldDisabledAlert';
import { YieldFeeSection } from '../components/YieldFeeSection';
import { YieldPendingTransactionModal } from '../components/YieldPendingTransactionModal';
import { YieldTxSimulationBottomSheet } from '../components/YieldTxSimulationBottomSheet';
import { useMessageSystemWrappedNative } from '../hooks/useMessageSystemWrappedNative';
import { useNavigateBackAnalytics } from '../hooks/useNavigateBackAnalytics';
import { useStandaloneWrappedNativeFlow } from '../hooks/useStandaloneWrappedNativeFlow';
import { useWrappedNativeTokenFees } from '../hooks/useWrappedNativeTokenFees';
import { useWrappedNativeTokenForm } from '../hooks/useWrappedNativeTokenForm';
import { useYieldCurrencyToggleAnalytics } from '../hooks/useYieldCurrencyToggleAnalytics';
import { getAccountTokenByContract } from '../utils/contractTokenBalanceUtils';

type RouteProps = RouteProp<
    WrappedNativeTokenStackParamList,
    WrappedNativeTokenStackRoutes.UnwrapNativeToken
>;

export const UnwrapNativeTokenScreen = () => {
    const route = useRoute<RouteProps>();
    const { accountKey, pendingTransaction } = route.params;

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

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
    const { amountValue } = form;
    const {
        formState: { isValid },
    } = form.form;

    const isUnwrapAmountReady = isValid && !!amountValue;
    const isUnwrapPending = !!pendingTransaction;
    const isFeeSectionDisplayed = isUnwrapAmountReady && !isUnwrapPending;

    const unwrapFee = useWrappedNativeTokenFees({
        account: account ?? null,
        amount: amountValue,
        flowType: 'unwrap',
        isEnabled: isFeeSectionDisplayed,
    });

    const flow = useStandaloneWrappedNativeFlow({
        account: account ?? null,
        accountKey,
        amountValue,
        flowType: 'unwrap',
        isDisabled: isUnwrapDisabled,
        pendingParam: pendingTransaction,
        preparedAction: unwrapFee.preparedAction,
    });

    const reportCurrencyToggle = useYieldCurrencyToggleAnalytics({
        networkSymbol: account?.symbol,
    });

    useNavigateBackAnalytics({
        type: events.yieldNavigateEvent.name,
        payload: {
            action: 'cancel',
            from: 'unwrap-form',
            to: 'account-detail',
            networkSymbol: account?.symbol,
        },
    });

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
                <YieldDepositFlowScreenHeader
                    account={account}
                    closeActionType="back"
                    title={
                        <Translation
                            id="earn.unwrapNativeToken.title"
                            values={{
                                nativeSymbol: getNetworkDisplaySymbol(account.symbol),
                                wrappedSymbol: wrappedNative.symbol,
                            }}
                        />
                    }
                    tokenContract={toTokenAddress(wrappedNative.address)}
                />
            }
        >
            <Box marginTop="sp16" pointerEvents={isUnwrapPending ? 'none' : 'auto'}>
                <VStack spacing="sp16">
                    <ContextMessage context={Context.getWrappedNative('unwrap')} />
                    {isUnwrapDisabled && (
                        <YieldDisabledAlert
                            type="unwrap"
                            content={unwrapDisabledContent}
                            variant={unwrapDisabledVariant}
                        />
                    )}
                    <Form form={form.form}>
                        <WrappedNativeTokenAmountInputCard
                            amountLabel={<Translation id="earn.unwrapNativeToken.amountToUnwrap" />}
                            balance={wrappedBalance}
                            onCurrencyChange={reportCurrencyToggle}
                            onMaxPress={flow.reportMaxSelected}
                            symbol={account.symbol}
                            tokenContract={toTokenAddress(wrappedNative.address)}
                            tokenDecimals={wrappedNative.decimals}
                            tokenSymbol={wrappedTokenSymbol}
                        />
                    </Form>
                    {isFeeSectionDisplayed && (
                        <YieldFeeSection
                            accountKey={account.key}
                            fees={unwrapFee}
                            tokenContract={toTokenAddress(wrappedNative.address)}
                        />
                    )}
                    {flow.isDeviceNotConnectedVisible && (
                        <BannerFull
                            intent="critical"
                            title={
                                <Translation id="earn.unwrapNativeToken.errors.deviceNotConnected" />
                            }
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
                            title={<Translation id="earn.unwrapNativeToken.complete.failedTitle" />}
                            description={
                                <Translation id="earn.unwrapNativeToken.complete.failedSubtitle" />
                            }
                        />
                    )}
                    <Button
                        isDisabled={isSubmitDisabled}
                        onPress={flow.handleSubmit}
                        testID="@unwrap-native-token/submit-button"
                    >
                        <Translation id="earn.unwrapNativeToken.submitButton" />
                    </Button>
                </VStack>
            </Box>
            {flow.preparedTx && (
                <YieldTxSimulationBottomSheet
                    ref={flow.simulationBottomSheetRef}
                    account={account}
                    flow="unwrap"
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
                    amountLabel={<Translation id="earn.unwrapNativeToken.amountToUnwrap" />}
                    amountTokenContract={toTokenAddress(wrappedNative.address)}
                    amountTokenSymbol={wrappedTokenSymbol}
                    fee={flow.pendingModalProps.fee}
                    isExploreDisabled={flow.pendingModalProps.isExploreDisabled}
                    onExplorePress={flow.pendingModalProps.onExplorePress}
                    submittedAt={flow.pendingModalProps.submittedAt}
                    title={<Translation id="earn.unwrapNativeToken.pendingTransactionTitle" />}
                />
            )}
        </Screen>
    );
};
