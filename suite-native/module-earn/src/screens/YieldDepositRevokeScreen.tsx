import { Box, Button, InlineAlertBox, ScreenFooterGradient, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';
import { FeeSelector } from '@suite-native/transaction-management';

import { YieldDepositRevokeDetailsCard } from '../components/YieldDepositRevokeDetailsCard';
import { YieldPendingTransactionModal } from '../components/YieldPendingTransactionModal';
import { useYieldDepositRevokeScreen } from '../hooks/useYieldDepositRevokeScreen';

export const YieldDepositRevokeScreen = () => {
    const revokeScreen = useYieldDepositRevokeScreen();

    if (revokeScreen === null) {
        return null;
    }

    const {
        account,
        accountLabel,
        feeSelectorProps,
        formattedApprovedAmount,
        handleReviewAndSign,
        isApprovedAmountUnlimited,
        isSubmitDisabled,
        isSubmitLoading,
        pendingBottomSheetRef,
        pendingModal,
        providerName,
        shouldShowLowLimitWarning,
        tokenContract,
        tokenSymbol,
        vault,
    } = revokeScreen;

    const pendingModalAmount = isApprovedAmountUnlimited ? (
        <Translation id="earn.yieldDepositFlowScreen.approvalLimitSheet.unlimited.title" />
    ) : (
        pendingModal?.amount
    );

    return (
        <Screen
            header={
                <DynamicScreenHeader
                    closeActionType="back"
                    subtitle={
                        shouldShowLowLimitWarning ? undefined : (
                            <Translation
                                id="earn.yieldDepositRevokeScreen.subtitle"
                                values={{ tokenSymbol }}
                            />
                        )
                    }
                    title={
                        <Translation
                            id="earn.yieldDepositRevokeScreen.title"
                            values={{ tokenSymbol }}
                        />
                    }
                />
            }
            footer={
                <>
                    <ScreenFooterGradient />
                    <Box paddingHorizontal="sp16" paddingBottom="sp16">
                        <Button
                            accessibilityRole="button"
                            isDisabled={isSubmitDisabled}
                            isLoading={isSubmitLoading}
                            onPress={handleReviewAndSign}
                        >
                            <Translation id="generic.buttons.continue" />
                        </Button>
                    </Box>
                </>
            }
        >
            <Box pointerEvents={pendingModal ? 'none' : 'auto'}>
                <VStack spacing="sp12">
                    {shouldShowLowLimitWarning && (
                        <InlineAlertBox
                            variant="warning"
                            title={
                                <Translation id="earn.yieldDepositRevokeScreen.lowLimitInfoAlert" />
                            }
                        />
                    )}

                    <YieldDepositRevokeDetailsCard
                        account={account}
                        accountLabel={accountLabel}
                        approvedAmount={formattedApprovedAmount}
                        isApprovedAmountUnlimited={isApprovedAmountUnlimited}
                        providerName={providerName}
                        tokenContract={tokenContract}
                        tokenSymbol={tokenSymbol}
                    />

                    {feeSelectorProps && <FeeSelector {...feeSelectorProps} />}
                </VStack>
            </Box>

            {pendingModal && (
                <YieldPendingTransactionModal
                    ref={pendingBottomSheetRef}
                    accountLabel={accountLabel}
                    accountSymbol={account.symbol}
                    amount={pendingModalAmount}
                    amountLabel={<Translation id="earn.yieldDepositFlowScreen.approvedAmount" />}
                    amountTokenContract={tokenContract}
                    amountTokenSymbol={pendingModal.amountTokenSymbol}
                    fee={pendingModal.fee}
                    isExploreDisabled={pendingModal.isExploreDisabled}
                    onExplorePress={pendingModal.onExplorePress}
                    submittedAt={pendingModal.submittedAt}
                    title={<Translation id="earn.yieldDepositRevokeScreen.pendingTitle" />}
                    vaultName={vault.metadata.name}
                    vaultTokenContract={tokenContract}
                />
            )}
        </Screen>
    );
};
