import { Context } from '@suite-common/message-system';
import { type WrappedNativeFlowType } from '@suite-common/wallet-core';
import { BannerFull, Box, Button, VStack } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { ContextMessage } from '@suite-native/message-system';
import { Screen } from '@suite-native/navigation';
import { TokenMetadataProvider } from '@suite-native/tokens';

import { EarnFeeSection } from './EarnFeeSection';
import { WrappedNativeFeeReserveBanner } from './WrappedNativeFeeReserveBanner';
import { WrappedNativeTokenAmountInputCard } from './WrappedNativeTokenAmountInputCard';
import { useStandaloneWrappedNativeController } from '../../hooks/earn/useStandaloneWrappedNativeController';
import { wrappedNativeFlowMessages } from '../../utils/earn/wrappedNativeFlowMessages';
import { YieldDisabledAlert } from '../yield/YieldDisabledAlert';
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
        feeReserve,
        feeSection,
        form,
        hasFlowFailed,
        isDeviceNotConnectedVisible,
        isFirmwareOutdatedVisible,
        isInteractionBlocked,
        nativeSymbol,
        pendingModal,
        simulationSheet,
        spentTokenContract,
        submit,
        wrappedTokenContract,
        wrappedTokenSymbol,
        wrappedTokenMetadata,
    } = controller;

    const messages = wrappedNativeFlowMessages[flowType].form;

    const content = (
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
                            isDisabled={amountInput.isDisabled}
                            maxAmount={amountInput.maxAmount}
                            onCurrencyChange={amountInput.onCurrencyChange}
                            onMaxPress={amountInput.onMaxPress}
                            symbol={account.symbol}
                            tokenContract={spentTokenContract}
                        />
                    </Form>

                    <WrappedNativeFeeReserveBanner
                        feeReserve={feeReserve}
                        networkSymbol={account.symbol}
                    />

                    {feeSection.isVisible && (
                        <EarnFeeSection
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
                title={<Translation id={messages.pendingTransactionTitle} />}
            />
        </Screen>
    );

    return (
        <TokenMetadataProvider
            sources={[{ networkSymbol: account.symbol, tokens: [wrappedTokenMetadata] }]}
        >
            {content}
        </TokenMetadataProvider>
    );
};
