import { Context } from '@suite-common/message-system';
import { WETH_WRAP_GAS_RESERVE } from '@suite-common/wallet-constants';
import { type WrappedNativeFlowType } from '@suite-common/wallet-core';
import { BannerFull, Box, Button, VStack } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { ContextMessage } from '@suite-native/message-system';
import { Screen } from '@suite-native/navigation';

import { WrappedNativeTokenAmountInputCard } from './WrappedNativeTokenAmountInputCard';
import { useStandaloneWrappedNativeController } from '../../hooks/earn/useStandaloneWrappedNativeController';
import { wrappedNativeFlowMessages } from '../../utils/earn/wrappedNativeFlowMessages';
import { YieldDisabledAlert } from '../yield/YieldDisabledAlert';
import { YieldFeeSection } from '../yield/YieldFeeSection';
import { YieldFlowScreenHeader } from '../yield/YieldFlowScreenHeader';
import { YieldSessionPendingModal } from '../yield/YieldSessionPendingModal';
import { YieldSessionTxSimulationSheet } from '../yield/YieldSessionTxSimulationSheet';

type StandaloneWrappedNativeFormProps = {
    flowType: WrappedNativeFlowType;
};

export const StandaloneWrappedNativeForm = ({ flowType }: StandaloneWrappedNativeFormProps) => {
    const controller = useStandaloneWrappedNativeController(flowType);

    if (controller.status !== 'ready') {
        return null;
    }

    const {
        account,
        accountLabel,
        amountInput,
        disabledAlert,
        feeSection,
        form,
        hasFlowFailed,
        isDeviceNotConnectedVisible,
        isFirmwareOutdatedVisible,
        isInteractionBlocked,
        isReserveRecommended,
        nativeSymbol,
        pendingModal,
        simulationSheet,
        spentSymbol,
        spentTokenContract,
        submit,
        wrappedTokenContract,
        wrappedTokenSymbol,
    } = controller;

    const messages = wrappedNativeFlowMessages[flowType].form;

    return (
        <Screen
            header={
                <YieldFlowScreenHeader
                    account={account}
                    closeActionType="back"
                    title={
                        <Translation
                            id={messages.title}
                            values={{ nativeSymbol, wrappedSymbol: wrappedTokenSymbol }}
                        />
                    }
                    tokenContract={wrappedTokenContract}
                />
            }
        >
            <Box marginTop="sp16" pointerEvents={isInteractionBlocked ? 'none' : 'auto'}>
                <VStack spacing="sp16">
                    <ContextMessage context={Context.getWrappedNative(flowType)} />
                    {disabledAlert && (
                        <YieldDisabledAlert
                            type={flowType}
                            content={disabledAlert.content}
                            variant={disabledAlert.variant}
                        />
                    )}
                    <Form form={form.form}>
                        <WrappedNativeTokenAmountInputCard
                            amountLabel={<Translation id={messages.amountLabel} />}
                            balance={amountInput.balance}
                            maxAmount={amountInput.maxAmount}
                            onCurrencyChange={amountInput.onCurrencyChange}
                            onMaxPress={amountInput.onMaxPress}
                            symbol={account.symbol}
                            tokenContract={spentTokenContract}
                            tokenDecimals={amountInput.tokenDecimals}
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
                    {feeSection.isVisible && (
                        <YieldFeeSection
                            accountKey={account.key}
                            fees={feeSection.fees}
                            tokenContract={spentTokenContract}
                        />
                    )}
                    {isDeviceNotConnectedVisible && (
                        <BannerFull
                            intent="critical"
                            title={<Translation id={messages.deviceNotConnectedError} />}
                        />
                    )}
                    {isFirmwareOutdatedVisible && (
                        <BannerFull
                            intent="critical"
                            title={<Translation id="earn.wrappedNativeToken.firmwareOutdated" />}
                        />
                    )}
                    {hasFlowFailed && (
                        <BannerFull
                            intent="critical"
                            title={<Translation id={messages.failedTitle} />}
                            description={<Translation id={messages.failedSubtitle} />}
                        />
                    )}
                    <Button
                        isDisabled={submit.isDisabled}
                        onPress={submit.onPress}
                        testID={`@${flowType}-native-token/submit-button`}
                    >
                        <Translation id={messages.submitButton} />
                    </Button>
                </VStack>
            </Box>
            <YieldSessionTxSimulationSheet
                account={account}
                flow={flowType}
                sheet={simulationSheet}
            />
            <YieldSessionPendingModal
                pendingModal={pendingModal}
                accountLabel={accountLabel}
                accountSymbol={account.symbol}
                amountLabel={<Translation id={messages.amountLabel} />}
                amountTokenContract={spentTokenContract}
                amountTokenSymbol={spentSymbol}
                title={<Translation id={messages.pendingTransactionTitle} />}
            />
        </Screen>
    );
};
