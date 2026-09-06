import { getNetwork } from '@suite-common/wallet-config';
import { BannerFull, Box, Text, VStack } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { Screen } from '@suite-native/navigation';

import { WrappedNativeTokenAmountInputCard } from '../../components/earn/WrappedNativeTokenAmountInputCard';
import { YieldDisabledAlert } from '../../components/yield/YieldDisabledAlert';
import { YieldFeeSection } from '../../components/yield/YieldFeeSection';
import { YieldFlowScreenHeader } from '../../components/yield/YieldFlowScreenHeader';
import { YieldSessionPendingModal } from '../../components/yield/YieldSessionPendingModal';
import { YieldSessionTxSimulationSheet } from '../../components/yield/YieldSessionTxSimulationSheet';
import { YieldWithdrawStepCard } from '../../components/yield/YieldWithdrawStepCard';
import { YieldWrappedNativeReceivingCard } from '../../components/yield/YieldWrappedNativeReceivingCard';
import { YieldWrappedNativeStepFooter } from '../../components/yield/YieldWrappedNativeStepFooter';
import { useYieldWithdrawUnwrapController } from '../../hooks/yield/controllers/useYieldWithdrawUnwrapController';

export const YieldWithdrawUnwrapScreen = () => {
    const controller = useYieldWithdrawUnwrapController();

    if (controller.status !== 'ready') {
        return null;
    }

    const {
        accountLabel,
        amountInput,
        disabledAlert,
        feeSection,
        footer,
        form,
        header,
        isDeviceNotConnectedVisible,
        isInteractionBlocked,
        nativeSymbol,
        pendingModal,
        receivingCard,
        simulationSheet,
        tokenContract,
        wrappedTokenContract,
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
                    closeActionType="back"
                    title={yieldFlowData.vaultTokenName}
                    tokenContract={tokenContract}
                />
            }
            footer={
                <YieldWrappedNativeStepFooter
                    flowType="unwrap"
                    isSkipFirst
                    isSubmitDisabled={footer.isSubmitDisabled}
                    isSubmitLoading={footer.isSubmitLoading}
                    onSkip={footer.onSkip}
                    onSubmit={footer.onSubmit}
                    spentSymbol={wrappedTokenSymbol}
                />
            }
        >
            <Box pointerEvents={isInteractionBlocked ? 'none' : 'auto'}>
                <Form form={form.form}>
                    <VStack spacing="sp16">
                        {disabledAlert && (
                            <Box paddingHorizontal="sp16">
                                <YieldDisabledAlert
                                    type="unwrap"
                                    content={disabledAlert.content}
                                    variant={disabledAlert.variant}
                                />
                            </Box>
                        )}

                        <YieldWithdrawStepCard
                            currentStepId="unwrap"
                            hasUnwrapStep
                            networkSymbol={account.symbol}
                        />

                        <Box paddingHorizontal="sp16">
                            <Text variant="body-sm" color="contentSecondary">
                                <Translation
                                    id="earn.yieldWithdrawFlowScreen.unwrapStepDescription"
                                    values={{
                                        networkName: getNetwork(account.symbol).name,
                                        tokenSymbol: wrappedTokenSymbol,
                                    }}
                                />
                            </Text>
                        </Box>

                        <Box paddingHorizontal="sp16">
                            <WrappedNativeTokenAmountInputCard
                                amountLabel={
                                    <Translation id="earn.unwrapNativeToken.amountToUnwrap" />
                                }
                                balance={amountInput.balance}
                                defaultAmount={amountInput.defaultAmount}
                                onCurrencyChange={amountInput.onCurrencyChange}
                                onMaxPress={amountInput.onMaxPress}
                                symbol={account.symbol}
                                tokenContract={wrappedTokenContract}
                                tokenDecimals={amountInput.tokenDecimals}
                                tokenSymbol={wrappedTokenSymbol}
                            />
                        </Box>

                        {receivingCard.isVisible && (
                            <Box paddingHorizontal="sp16">
                                <YieldWrappedNativeReceivingCard
                                    amount={receivingCard.amount}
                                    networkSymbol={account.symbol}
                                    tokenDecimals={receivingCard.tokenDecimals}
                                    tokenSymbol={nativeSymbol}
                                />
                            </Box>
                        )}

                        {isDeviceNotConnectedVisible && (
                            <Box paddingHorizontal="sp16">
                                <BannerFull
                                    intent="critical"
                                    title={
                                        <Translation id="earn.unwrapNativeToken.errors.deviceNotConnected" />
                                    }
                                />
                            </Box>
                        )}

                        {feeSection.isVisible && (
                            <Box paddingHorizontal="sp16">
                                <YieldFeeSection
                                    accountKey={account.key}
                                    fees={feeSection.fees}
                                    tokenContract={wrappedTokenContract}
                                />
                            </Box>
                        )}
                    </VStack>
                </Form>
            </Box>
            <YieldSessionPendingModal
                pendingModal={pendingModal}
                shouldHandleDismiss
                accountLabel={accountLabel}
                accountSymbol={account.symbol}
                amountLabel={<Translation id="earn.unwrapNativeToken.amountToUnwrap" />}
                amountTokenContract={wrappedTokenContract}
                amountTokenSymbol={wrappedTokenSymbol}
                title={<Translation id="earn.yieldWithdrawFlowScreen.unwrapPendingTitle" />}
                vaultName={yieldFlowData.vaultTokenName}
                vaultTokenContract={tokenContract}
            />
            <YieldSessionTxSimulationSheet
                account={account}
                flow="unwrap"
                sheet={simulationSheet}
            />
        </Screen>
    );
};
