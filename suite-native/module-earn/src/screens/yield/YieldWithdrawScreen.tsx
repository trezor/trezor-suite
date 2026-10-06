import { Context } from '@suite-common/message-system';
import {
    AnimatedDoubleInput,
    Box,
    Button,
    Card,
    HStack,
    Hint,
    Input,
    ScreenFooterGradient,
    Text,
    VStack,
} from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { ContextMessage } from '@suite-native/message-system';
import { Screen } from '@suite-native/navigation';
import { FeeSelector } from '@suite-native/transaction-management';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { EarnApproximateFiatAmount } from '../../components/earn/EarnApproximateFiatAmount';
import { EarnMaxSwitch } from '../../components/earn/EarnMaxSwitch';
import { YieldDisabledAlert } from '../../components/yield/YieldDisabledAlert';
import { YieldFeeEstimationErrorAlert } from '../../components/yield/YieldFeeEstimationErrorAlert';
import { YieldFlowScreenHeader } from '../../components/yield/YieldFlowScreenHeader';
import { YieldFormattedAmount } from '../../components/yield/YieldFormattedAmount';
import { YieldPendingTransactionModal } from '../../components/yield/YieldPendingTransactionModal';
import { YieldWithdrawStepCard } from '../../components/yield/YieldWithdrawStepCard';
import { YieldWithdrawWarning } from '../../components/yield/YieldWithdrawWarning';
import {
    AMOUNT_INPUT_MAX_LENGTH,
    AMOUNT_INPUT_UNFOCUSED_OFFSET,
    AMOUNT_INPUT_WRAPPER_HEIGHT,
} from '../../constants';
import { useYieldWithdrawController } from '../../hooks/yield/controllers/useYieldWithdrawController';
import { getYieldTokenContract } from '../../utils/yield/yieldFiatAmountUtils';

const withdrawFormCardStyle = prepareNativeStyle(utils => ({
    borderColor: utils.colors.borderNeutral,
    borderWidth: utils.borders.widths.small,
}));

const screenFooterStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.surfaceFillPage,
    paddingBottom: utils.spacings.sp16,
    paddingHorizontal: utils.spacings.sp16,
}));

const withdrawOutputAmountInputStyle = prepareNativeStyle(utils => ({
    paddingRight: utils.spacings.sp64 + utils.spacings.sp32,
}));

export const YieldWithdrawScreen = () => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();
    const controller = useYieldWithdrawController();

    if (controller.status !== 'ready') {
        return null;
    }

    const {
        accountLabel,
        amountForm,
        depositedRow,
        disabledAlert,
        feeEstimationError,
        feeSelector,
        footer,
        header,
        isInteractionBlocked,
        pendingModal,
        stepCard,
        tokenContract,
        warning,
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
                    tokenContract={header.tokenContract}
                />
            }
            footer={
                <>
                    <ScreenFooterGradient />
                    <Box style={applyStyle(screenFooterStyle)}>
                        <Button
                            isDisabled={footer.isDisabled}
                            isLoading={footer.isLoading}
                            onPress={footer.onContinue}
                        >
                            <Translation id="generic.buttons.continue" />
                        </Button>
                    </Box>
                </>
            }
        >
            <VStack spacing="sp16" pointerEvents={isInteractionBlocked ? 'none' : 'auto'}>
                <YieldWithdrawStepCard
                    currentStepId="withdraw"
                    hasUnwrapStep={stepCard.hasUnwrapStep}
                    networkSymbol={account.symbol}
                />
                <VStack spacing="sp16" paddingHorizontal="sp16">
                    <ContextMessage context={Context.getEarnYield('withdraw')} />
                    {disabledAlert && (
                        <YieldDisabledAlert
                            type="withdraw"
                            content={disabledAlert.content}
                            variant={disabledAlert.variant}
                        />
                    )}
                    <Card style={applyStyle(withdrawFormCardStyle)}>
                        <VStack spacing="sp12">
                            <HStack justifyContent="space-between" alignItems="center">
                                <Text variant="body-sm">
                                    <Translation id="earn.yieldWithdrawFlowScreen.withdrawalAmount" />
                                </Text>
                                {depositedRow && (
                                    <EarnMaxSwitch
                                        isChecked={amountForm.isMaxSelected}
                                        onChange={amountForm.onMaxChange}
                                        testID="@yield-withdraw/max-switch"
                                    />
                                )}
                            </HStack>

                            <AnimatedDoubleInput
                                activeView={amountForm.isSharesInput ? 'secondary' : 'primary'}
                                onInputSwitch={amountForm.onInputSwitch}
                                unfocusedOffset={AMOUNT_INPUT_UNFOCUSED_OFFSET}
                                wrapperHeight={AMOUNT_INPUT_WRAPPER_HEIGHT}
                                renderPrimary={({ inputRef, isDisabled, onPress }) => (
                                    <Input
                                        ref={inputRef}
                                        labelType="noLabel"
                                        value={amountForm.assetAmount}
                                        placeholder="0"
                                        keyboardType="numeric"
                                        maxLength={AMOUNT_INPUT_MAX_LENGTH}
                                        editable={!isDisabled && !amountForm.isMaxSelected}
                                        onChangeText={amountForm.onAmountChange}
                                        onPress={onPress}
                                        hasError={!isDisabled && !!amountForm.validationError}
                                        accessibilityLabel={translate(
                                            'earn.yieldWithdrawFlowScreen.amountToWithdraw',
                                        )}
                                        rightIcon={
                                            <Text
                                                color={
                                                    isDisabled
                                                        ? 'contentSecondary'
                                                        : 'contentPrimary'
                                                }
                                                numberOfLines={1}
                                            >
                                                {amountForm.underlyingTokenSymbol}
                                            </Text>
                                        }
                                    />
                                )}
                                renderSecondary={({ inputRef, isDisabled, onPress }) => (
                                    <Input
                                        ref={inputRef}
                                        labelType="noLabel"
                                        value={amountForm.sharesAmount}
                                        placeholder="0"
                                        keyboardType="numeric"
                                        maxLength={AMOUNT_INPUT_MAX_LENGTH}
                                        editable={!isDisabled && !amountForm.isMaxSelected}
                                        onChangeText={amountForm.onAmountChange}
                                        onPress={onPress}
                                        style={applyStyle(withdrawOutputAmountInputStyle)}
                                        hasError={!isDisabled && !!amountForm.validationError}
                                        accessibilityLabel={translate(
                                            'earn.yieldWithdrawFlowScreen.amountToWithdraw',
                                        )}
                                        rightIcon={
                                            <Text
                                                color={
                                                    isDisabled
                                                        ? 'contentSecondary'
                                                        : 'contentPrimary'
                                                }
                                                numberOfLines={1}
                                            >
                                                {amountForm.vaultTokenSymbol}
                                            </Text>
                                        }
                                    />
                                )}
                            />
                            {amountForm.validationError && (
                                <Hint variant="error">
                                    <Translation id={amountForm.validationError} />
                                </Hint>
                            )}

                            {depositedRow && (
                                <HStack
                                    spacing="sp8"
                                    justifyContent="space-between"
                                    alignItems="center"
                                >
                                    <HStack spacing="sp4" alignItems="center" flexShrink={1}>
                                        <Text variant="body-sm" color="contentSecondary">
                                            <Translation id="earn.yieldWithdrawFlowScreen.deposited" />
                                        </Text>
                                        <Box flexShrink={1}>
                                            <YieldFormattedAmount
                                                value={depositedRow.amount}
                                                networkSymbol={account.symbol}
                                                tokenContract={depositedRow.tokenContract}
                                                tokenDecimals={depositedRow.tokenDecimals}
                                                tokenSymbol={depositedRow.tokenSymbol}
                                                variant="body-sm"
                                                color="contentSecondary"
                                                numberOfLines={1}
                                                ellipsizeMode="tail"
                                            />
                                        </Box>
                                    </HStack>
                                    <EarnApproximateFiatAmount
                                        amount={depositedRow.approximateAmount}
                                        symbol={account.symbol}
                                        tokenContract={getYieldTokenContract(
                                            yieldFlowData.flowData.token,
                                        )}
                                    />
                                </HStack>
                            )}
                        </VStack>
                    </Card>

                    {feeEstimationError && (
                        <YieldFeeEstimationErrorAlert onRetry={feeEstimationError.onRetry} />
                    )}

                    {feeSelector && (
                        <FeeSelector
                            accountKey={account.key}
                            tokenContract={tokenContract}
                            updateThunk={feeSelector.updateFeeLevelThunk}
                            selectedFee={feeSelector.selectedFee}
                            selectedFeePerUnit={feeSelector.formDraft.feePerUnit}
                            formDraft={feeSelector.formDraft}
                            formDraftKey={feeSelector.formDraftKey}
                        />
                    )}

                    <YieldWithdrawWarning
                        isAmountTooHigh={warning.isAmountTooHigh}
                        isMaxWithdrawInfoVisible={warning.isMaxWithdrawInfoVisible}
                        shouldShowNetworkFeeWarning={warning.shouldShowNetworkFeeWarning}
                        vaultTokenSymbol={amountForm.vaultTokenSymbol}
                    />
                </VStack>
            </VStack>
            {pendingModal && (
                <YieldPendingTransactionModal
                    ref={pendingModal.bottomSheetRef}
                    accountLabel={accountLabel}
                    accountSymbol={account.symbol}
                    amount={pendingModal.pendingTransaction.amount}
                    amountLabel={<Translation id="earn.yieldWithdrawFlowScreen.amountToWithdraw" />}
                    amountTokenContract={pendingModal.amountTokenContract}
                    amountTokenSymbol={pendingModal.amountTokenSymbol}
                    fee={pendingModal.pendingTransaction.fee}
                    isExploreDisabled={pendingModal.isExploreDisabled}
                    onDismiss={pendingModal.onDismiss}
                    onExplorePress={pendingModal.onExplorePress}
                    submittedAt={new Date(pendingModal.pendingTransaction.submittedAt ?? 0)}
                    txid={pendingModal.pendingTransaction.txid}
                    title={<Translation id="earn.yieldWithdrawFlowScreen.withdrawPendingTitle" />}
                    vaultName={yieldFlowData.vaultTokenName}
                    vaultTokenContract={pendingModal.vaultTokenContract}
                />
            )}
        </Screen>
    );
};
