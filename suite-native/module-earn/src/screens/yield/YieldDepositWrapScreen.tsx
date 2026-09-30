import { Context } from '@suite-common/message-system';
import { BannerFull, Box, VStack } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { ContextMessage } from '@suite-native/message-system';
import { Screen } from '@suite-native/navigation';

import { WrappedNativeFeeReserveBanner } from '../../components/earn/WrappedNativeFeeReserveBanner';
import { WrappedNativeTokenAmountInputCard } from '../../components/earn/WrappedNativeTokenAmountInputCard';
import { YieldDepositStepCard } from '../../components/yield/YieldDepositStepCard';
import { YieldDisabledAlert } from '../../components/yield/YieldDisabledAlert';
import { YieldFeeSection } from '../../components/yield/YieldFeeSection';
import { YieldFlowScreenHeader } from '../../components/yield/YieldFlowScreenHeader';
import { YieldSessionPendingModal } from '../../components/yield/YieldSessionPendingModal';
import { YieldSessionTxSimulationSheet } from '../../components/yield/YieldSessionTxSimulationSheet';
import { YieldWrappedNativeReceivingCard } from '../../components/yield/YieldWrappedNativeReceivingCard';
import { YieldWrappedNativeStepFooter } from '../../components/yield/YieldWrappedNativeStepFooter';
import { useYieldDepositWrapController } from '../../hooks/yield/controllers/useYieldDepositWrapController';

export const YieldDepositWrapScreen = () => {
    const controller = useYieldDepositWrapController();

    if (controller.status !== 'ready') {
        return null;
    }

    const {
        accountLabel,
        amountInput,
        disabledAlerts,
        feeReserve,
        feeSection,
        footer,
        form,
        header,
        isDeviceNotConnectedVisible,
        isFirmwareOutdatedVisible,
        isInteractionBlocked,
        nativeSymbol,
        pendingModal,
        receivingCard,
        simulationSheet,
        tokenContract,
        wrappedTokenSymbol,
        yieldFlowData,
    } = controller;
    const { account } = yieldFlowData;

    return (
        <Screen
            noHorizontalPadding
            header={
                <YieldFlowScreenHeader
                    account={account}
                    closeAction={header.onClose}
                    title={yieldFlowData.vaultTokenName}
                    tokenContract={tokenContract}
                />
            }
            footer={
                <YieldWrappedNativeStepFooter
                    flowType="wrap"
                    isSubmitDisabled={footer.isSubmitDisabled}
                    isSubmitLoading={footer.isSubmitLoading}
                    onSkip={footer.onSkip}
                    onSubmit={footer.onSubmit}
                    spentSymbol={nativeSymbol}
                />
            }
        >
            <Box pointerEvents={isInteractionBlocked ? 'none' : 'auto'}>
                <Form form={form.form}>
                    <VStack spacing="sp16">
                        <YieldDepositStepCard
                            currentStepId="wrap"
                            hasWrapStep
                            networkSymbol={account.symbol}
                        />

                        <ContextMessage
                            context={Context.getWrappedNative('wrap')}
                            marginHorizontal="sp16"
                        />
                        {disabledAlerts.map(alert => (
                            <Box key={alert.type} paddingHorizontal="sp16">
                                <YieldDisabledAlert
                                    type={alert.type}
                                    content={alert.content}
                                    variant={alert.variant}
                                />
                            </Box>
                        ))}

                        <Box paddingHorizontal="sp16">
                            <WrappedNativeTokenAmountInputCard
                                amountLabel={<Translation id="earn.wrapNativeToken.amountToWrap" />}
                                balance={amountInput.balance}
                                isDisabled={amountInput.isDisabled}
                                maxAmount={amountInput.maxAmount}
                                onCurrencyChange={amountInput.onCurrencyChange}
                                onMaxPress={amountInput.onMaxPress}
                                symbol={account.symbol}
                                tokenSymbol={nativeSymbol}
                            />
                        </Box>

                        {receivingCard.isVisible && (
                            <Box paddingHorizontal="sp16">
                                <YieldWrappedNativeReceivingCard
                                    amount={receivingCard.amount}
                                    networkSymbol={account.symbol}
                                    tokenContract={receivingCard.tokenContract}
                                    tokenDecimals={receivingCard.tokenDecimals}
                                    tokenSymbol={wrappedTokenSymbol}
                                />
                            </Box>
                        )}

                        <WrappedNativeFeeReserveBanner
                            feeReserve={feeReserve}
                            networkSymbol={account.symbol}
                            paddingHorizontal="sp16"
                        />

                        {isDeviceNotConnectedVisible && (
                            <Box paddingHorizontal="sp16">
                                <BannerFull
                                    intent="critical"
                                    title={
                                        <Translation id="earn.wrapNativeToken.errors.deviceNotConnected" />
                                    }
                                />
                            </Box>
                        )}

                        {isFirmwareOutdatedVisible && (
                            <Box paddingHorizontal="sp16">
                                <BannerFull
                                    intent="critical"
                                    title={
                                        <Translation id="earn.wrappedNativeToken.firmwareOutdated" />
                                    }
                                />
                            </Box>
                        )}

                        {feeSection.isVisible && (
                            <Box paddingHorizontal="sp16">
                                <YieldFeeSection accountKey={account.key} fees={feeSection.fees} />
                            </Box>
                        )}
                    </VStack>
                </Form>
            </Box>
            <YieldSessionPendingModal
                pendingModal={pendingModal}
                accountLabel={accountLabel}
                accountSymbol={account.symbol}
                amountLabel={<Translation id="earn.wrapNativeToken.amountToWrap" />}
                amountTokenSymbol={nativeSymbol}
                title={<Translation id="earn.wrapNativeToken.pendingTransactionTitle" />}
                vaultName={yieldFlowData.vaultTokenName}
                vaultTokenContract={tokenContract}
            />
            <YieldSessionTxSimulationSheet account={account} flow="wrap" sheet={simulationSheet} />
        </Screen>
    );
};
