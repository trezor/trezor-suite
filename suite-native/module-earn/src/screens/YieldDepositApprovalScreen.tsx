import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { type RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { Context } from '@suite-common/message-system';
import { getNetwork } from '@suite-common/wallet-config';
import {
    getYieldApprovalAction,
    getYieldVaultContractAddress,
    stablecoinYieldActions,
} from '@suite-common/wallet-core';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
import { BannerFull, Box, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { ContextMessage } from '@suite-native/message-system';
import {
    Screen,
    type StackNavigationProps,
    type YieldStackParamList,
    YieldStackRoutes,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { FeeSelector } from '@suite-native/transaction-management';

import { YieldAmountInputCard } from '../components/YieldAmountInputCard';
import { YieldDepositApprovalLimitBottomSheet } from '../components/YieldDepositApprovalLimitBottomSheet';
import { YieldDepositApprovedAmountCard } from '../components/YieldDepositApprovedAmountCard';
import { YieldDepositFlowFooter } from '../components/YieldDepositFlowFooter';
import { YieldDepositFlowScreenHeader } from '../components/YieldDepositFlowScreenHeader';
import { YieldDepositInfoBottomSheet } from '../components/YieldDepositInfoBottomSheet';
import { YieldDepositStepCard } from '../components/YieldDepositStepCard';
import { YieldDisabledAlert } from '../components/YieldDisabledAlert';
import { YieldPendingTransactionModal } from '../components/YieldPendingTransactionModal';
import { useMessageSystemYield } from '../hooks/useMessageSystemYield';
import { useRefreshYieldDepositAllowanceOnIdle } from '../hooks/useRefreshYieldDepositAllowanceOnIdle';
import { useReturnToYieldDepositWrapStep } from '../hooks/useReturnToYieldDepositWrapStep';
import { useShowYieldTransactionFailureAlert } from '../hooks/useShowYieldTransactionFailureAlert';
import { useYieldApprovalFees } from '../hooks/useYieldApprovalFees';
import { useYieldApprovalLimit } from '../hooks/useYieldApprovalLimit';
import { useYieldApprovedAmountDisplay } from '../hooks/useYieldApprovedAmountDisplay';
import { useYieldCurrencyToggleAnalytics } from '../hooks/useYieldCurrencyToggleAnalytics';
import { useYieldDepositApprovalSubmit } from '../hooks/useYieldDepositApprovalSubmit';
import { useYieldDepositForm } from '../hooks/useYieldDepositForm';
import { useYieldFlowData } from '../hooks/useYieldFlowData';
import { useYieldPendingTransaction } from '../hooks/useYieldPendingTransaction';
import { useYieldPendingTransactionTracking } from '../hooks/useYieldPendingTransactionTracking';
import { useYieldSession } from '../hooks/useYieldSession';
import { getYieldApprovalAnalyticsType } from '../utils/yieldAnalyticsUtils';
import { getYieldTokenContract } from '../utils/yieldFiatAmountUtils';
import { isYieldApprovalAllowanceUnlimited } from '../yieldApprovalUtils';

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldDepositApproval>;
type NavigationProps = StackNavigationProps<
    YieldStackParamList,
    YieldStackRoutes.YieldDepositApproval
>;

export const YieldDepositApprovalScreen = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProps>();
    const dispatch = useDispatch();
    const isFocused = useIsFocused();
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const {
        bottomSheetRef: infoBottomSheetRef,
        closeModal: closeInfoBottomSheet,
        openModal: openInfoBottomSheet,
    } = useBottomSheetModal();
    const {
        bottomSheetRef: approvalLimitBottomSheetRef,
        closeModal: closeApprovalLimitBottomSheet,
        openModal: openApprovalLimitBottomSheet,
    } = useBottomSheetModal();

    const yieldFlowData = useYieldFlowData(route.params);

    const {
        account,
        flowData,
        apy,
        bonusRewardTokenSymbol,
        flowKey,
        token,
        tokenSymbol,
        vault,
        vaultTokenSymbol,
        vaultTokenName,
        resolutionStatus,
        wrappedNativeSymbol,
    } = yieldFlowData;

    const vaultContractAddress = vault ? getYieldVaultContractAddress(vault) : undefined;
    const reportCurrencyToggle = useYieldCurrencyToggleAnalytics({
        networkSymbol: account?.symbol,
        vaultId: vault?.id,
    });
    const {
        isDisabled: isDepositDisabled,
        content: depositDisabledContent,
        variant: depositDisabledVariant,
    } = useMessageSystemYield('deposit', { vaultContractAddress });
    const session = useYieldSession({
        flowKey,
        flowType: 'deposit',
        isWrappedNativeVault: yieldFlowData.isWrappedNativeVault,
        shouldDisposeOnGoBack: true,
    });
    const isAllowanceAmountUnlimited = isYieldApprovalAllowanceUnlimited({ session, token });
    const defaultApprovalLimitType = isAllowanceAmountUnlimited ? 'unlimited' : 'per-deposit';
    const { approvalLimitTitle, approvalLimitType, setApprovalLimitType } =
        useYieldApprovalLimit(defaultApprovalLimitType);
    const sessionStep = session?.step;
    const allowanceAmount = session?.approval.allowanceAmount;
    const allowanceStatus = session?.approval.allowanceStatus;
    const {
        pendingBottomSheetRef,
        pendingModalProps,
        pendingTransaction: approvalPendingTransaction,
        reopenPendingBottomSheet,
    } = useYieldPendingTransaction({
        accountKey: account?.key,
        isFocused,
        pendingTransaction: session?.action.pendingTransaction,
        transactionType: 'approve',
    });
    const isApprovalPending = !!approvalPendingTransaction;
    const { formattedApprovedAmount, hasApprovedAmount } = useYieldApprovedAmountDisplay({
        allowanceAmount,
        isApprovedAmountUnlimited: isAllowanceAmountUnlimited,
        tokenSymbol,
    });
    const shouldShowApprovedAmountCard = allowanceStatus === 'loaded' && hasApprovedAmount;

    const hasWrappedAmount = !!session?.result.wrappedAmount;
    const depositForm = useYieldDepositForm({
        defaultAmount:
            session?.approval.isModifyMode || hasWrappedAmount ? session?.action.amount : undefined,
        token,
        tokenSymbol,
        wrappedAmount: session?.result.wrappedAmount,
    });
    const { amountValue, availableBalance, form, handleMaxPress } = depositForm;
    const handleMaxPressWithAnalytics = useCallback(() => {
        analytics.report({
            type: events.yieldInteractionEvent.name,
            payload: {
                element: 'deposit-max',
                networkSymbol: account?.symbol,
                vaultId: vault?.id,
            },
        });

        handleMaxPress();
    }, [account?.symbol, analytics, handleMaxPress, vault?.id]);
    const {
        formState: { isValid },
    } = form;
    const shouldShowApprovalFee = isValid && !!amountValue;
    const footerApprovalAction =
        allowanceStatus === 'loaded'
            ? getYieldApprovalAction({
                  liveAmount: amountValue ?? '',
                  allowanceAmount,
                  isModifyMode: hasApprovedAmount,
                  isRevokeRequired: session?.approval.isRevokeRequired ?? false,
                  tokenContractAddress: token?.contractAddress,
              })
            : undefined;
    const {
        formDraft: approvalFeeFormDraft,
        formDraftKey: approvalFeeFormDraftKey,
        isAllowanceFeeReady,
        selectedFee: selectedApprovalFee,
        updateFeeLevelThunk: updateApprovalFeeLevelThunk,
    } = useYieldApprovalFees({
        amount: amountValue,
        approvalLimitType,
        flowKey,
        isEnabled: isValid,
        flowData,
        tokenContract: route.params.tokenContract,
    });
    const { handleSubmitApproval, isCheckingApproval } = useYieldDepositApprovalSubmit({
        approvalLimitType,
        flowData,
        flowKey,
        routeParams: route.params,
    });
    const isApprovalSessionReady = sessionStep === 'approve';
    const canSkipApproval = isApprovalSessionReady && shouldShowApprovedAmountCard;
    const canSubmitApproval =
        isValid &&
        isAllowanceFeeReady &&
        isApprovalSessionReady &&
        !isApprovalPending &&
        !isCheckingApproval;
    const isSubmitDisabled = !canSubmitApproval || isDepositDisabled;

    useShowYieldTransactionFailureAlert({
        error: session?.error,
        flowKey,
        flowType: 'deposit',
        isEnabled: isFocused,
    });

    useRefreshYieldDepositAllowanceOnIdle({
        allowanceStatus,
        yieldFlowData,
    });

    const returnToWrapStep = useReturnToYieldDepositWrapStep({
        flowKey,
        routeParams: route.params,
    });

    const handleApprovalConfirmed = useCallback(() => {
        navigation.navigate(YieldStackRoutes.YieldDeposit, route.params);
    }, [navigation, route.params]);
    const handleCloseApproval = useCallback(() => {
        const isApprovalRemovedByPopToTop = navigation.getState().routes.length > 1;

        navigateToInitialScreen();

        if (!isApprovalRemovedByPopToTop || !flowKey || isApprovalPending) {
            return;
        }

        dispatch(stablecoinYieldActions.disposeSession({ flowType: 'deposit', flowKey }));
    }, [dispatch, flowKey, isApprovalPending, navigateToInitialScreen, navigation]);

    const handleSkipApproval = useCallback(() => {
        if (!flowKey || isApprovalPending) {
            return;
        }

        analytics.report({
            type: events.yieldDepositEvent.name,
            payload: {
                action: 'continue',
                type: 'approve-skipped',
                networkSymbol: account?.symbol,
                vaultId: yieldFlowData.vault?.id,
            },
        });

        dispatch(
            stablecoinYieldActions.skipApprovalStep({
                flowType: 'deposit',
                flowKey,
                amount: amountValue || undefined,
            }),
        );

        navigation.navigate(YieldStackRoutes.YieldDeposit, route.params);
    }, [
        account?.symbol,
        amountValue,
        analytics,
        dispatch,
        flowKey,
        isApprovalPending,
        navigation,
        yieldFlowData.vault?.id,
        route.params,
    ]);

    const handleNavigateToRevoke = useCallback(() => {
        if (!flowKey || isApprovalPending) {
            return;
        }

        analytics.report({
            type: events.yieldDepositEvent.name,
            payload: {
                action: 'continue',
                type: 'revoke',
                networkSymbol: account?.symbol,
                vaultId: yieldFlowData.vault?.id,
            },
        });

        const amount =
            amountValue !== undefined && isPositiveBalance(amountValue) ? amountValue : undefined;

        if (amount) {
            dispatch(
                stablecoinYieldActions.enterModifyMode({
                    flowType: 'deposit',
                    flowKey,
                    amount,
                }),
            );
        }

        navigation.navigate(YieldStackRoutes.YieldDepositRevoke, {
            ...route.params,
            amount,
        });
    }, [
        account?.symbol,
        amountValue,
        analytics,
        dispatch,
        flowKey,
        isApprovalPending,
        navigation,
        yieldFlowData.vault?.id,
        route.params,
    ]);

    useYieldPendingTransactionTracking({
        account,
        flowKey,
        flowType: 'deposit',
        isScreenFocused: isFocused,
        onApprovalConfirmed: handleApprovalConfirmed,
        pendingTransaction: approvalPendingTransaction,
        vault: yieldFlowData.vault,
    });

    const handleCloseInfoBottomSheet = useCallback(() => {
        closeInfoBottomSheet();
        reopenPendingBottomSheet();
    }, [closeInfoBottomSheet, reopenPendingBottomSheet]);

    const handleSubmit = form.handleSubmit(async ({ amount }) => {
        if (isSubmitDisabled) {
            return;
        }

        analytics.report({
            type: events.yieldDepositEvent.name,
            payload: {
                action: 'continue',
                type: footerApprovalAction === 'revoke' ? 'revoke' : 'approve',
                networkSymbol: account?.symbol,
                vaultId: yieldFlowData.vault?.id,
                approvalType: getYieldApprovalAnalyticsType(approvalLimitType),
            },
        });

        await handleSubmitApproval(amount);
    });

    const handleOpenInfoBottomSheet = useCallback(() => {
        analytics.report({
            type: events.yieldInteractionEvent.name,
            payload: {
                element: 'in-a-nutshell-process-tab',
                value: 'deposit',
                networkSymbol: account?.symbol,
                vaultId: yieldFlowData.vault?.id,
            },
        });
        openInfoBottomSheet();
    }, [account?.symbol, analytics, openInfoBottomSheet, yieldFlowData.vault?.id]);

    if (resolutionStatus !== 'resolved') {
        return null;
    }

    const accountLabel = account.accountLabel ?? getNetwork(account.symbol).name;
    const pendingModalAmount = approvalPendingTransaction?.isAmountUnlimited ? (
        <Translation id="earn.yieldDepositFlowScreen.approvalLimitSheet.unlimited.title" />
    ) : (
        approvalPendingTransaction?.amount
    );
    const pendingModalAmountTokenSymbol = approvalPendingTransaction?.isAmountUnlimited
        ? undefined
        : tokenSymbol;

    return (
        <Screen
            noHorizontalPadding
            header={
                <YieldDepositFlowScreenHeader
                    account={account}
                    closeAction={handleCloseApproval}
                    onInfoPress={handleOpenInfoBottomSheet}
                    title={vaultTokenName}
                    tokenContract={route.params.tokenContract}
                />
            }
            footer={
                <YieldDepositFlowFooter
                    amountValue={amountValue}
                    approvalAction={footerApprovalAction}
                    apy={apy}
                    isDisabled={isSubmitDisabled}
                    isLoading={isCheckingApproval}
                    isSkipDisabled={isApprovalPending || isCheckingApproval}
                    onPress={handleSubmit}
                    onSkipPress={canSkipApproval ? handleSkipApproval : undefined}
                    tokenSymbol={wrappedNativeSymbol ?? tokenSymbol}
                />
            }
        >
            <Box pointerEvents={isApprovalPending ? 'none' : 'auto'}>
                <Form form={form}>
                    <VStack spacing="sp16">
                        <ContextMessage
                            context={Context.getEarnYield('deposit')}
                            marginHorizontal="sp16"
                        />
                        {isDepositDisabled && (
                            <Box paddingHorizontal="sp16">
                                <YieldDisabledAlert
                                    type="deposit"
                                    content={depositDisabledContent}
                                    variant={depositDisabledVariant}
                                />
                            </Box>
                        )}
                        <YieldDepositStepCard
                            currentStepId="approval"
                            hasWrapStep={yieldFlowData.isWrappedNativeVault}
                            isWrapStepSkipped={!hasWrappedAmount}
                            networkSymbol={account.symbol}
                            onEditStep={{ wrap: returnToWrapStep }}
                        />

                        {shouldShowApprovedAmountCard && (
                            <Box paddingHorizontal="sp16">
                                <YieldDepositApprovedAmountCard
                                    actionType="revoke"
                                    approvedAmount={formattedApprovedAmount}
                                    isApprovedAmountUnlimited={isAllowanceAmountUnlimited}
                                    networkSymbol={account.symbol}
                                    onActionPress={handleNavigateToRevoke}
                                    tokenContract={route.params.tokenContract}
                                />
                            </Box>
                        )}

                        <Box paddingHorizontal="sp16">
                            <YieldAmountInputCard
                                amountLabel={
                                    <Translation id="earn.yieldDepositFlowScreen.amountToDeposit" />
                                }
                                approvalLimitTitle={approvalLimitTitle}
                                balance={availableBalance}
                                isApprovalLimitDisabled={isAllowanceAmountUnlimited}
                                onApprovalLimitPress={openApprovalLimitBottomSheet}
                                onCurrencyChange={reportCurrencyToggle}
                                onMaxPress={handleMaxPressWithAnalytics}
                                symbol={account.symbol}
                                tokenContract={getYieldTokenContract(token)}
                                tokenDecimals={token.decimals}
                                tokenSymbol={tokenSymbol}
                            />
                        </Box>

                        {footerApprovalAction === 'revoke' && (
                            <Box paddingHorizontal="sp16">
                                <BannerFull
                                    intent="warning"
                                    title={
                                        <Translation id="earn.yieldDepositFlowScreen.alerts.approvalIncreaseRequiresRevoke.title" />
                                    }
                                />
                            </Box>
                        )}

                        {shouldShowApprovalFee && (
                            <Box paddingHorizontal="sp16">
                                <FeeSelector
                                    accountKey={account.key}
                                    tokenContract={route.params.tokenContract}
                                    updateThunk={updateApprovalFeeLevelThunk}
                                    selectedFee={selectedApprovalFee}
                                    selectedFeePerUnit={approvalFeeFormDraft?.feePerUnit}
                                    formDraft={approvalFeeFormDraft}
                                    formDraftKey={approvalFeeFormDraftKey}
                                />
                            </Box>
                        )}
                    </VStack>
                </Form>
            </Box>
            {approvalPendingTransaction && pendingModalProps && (
                <YieldPendingTransactionModal
                    ref={pendingBottomSheetRef}
                    accountLabel={accountLabel}
                    accountSymbol={account.symbol}
                    amount={pendingModalAmount}
                    amountLabel={<Translation id="earn.yieldDepositFlowScreen.approvalLimit" />}
                    amountTokenContract={route.params.tokenContract}
                    amountTokenSymbol={pendingModalAmountTokenSymbol}
                    fee={pendingModalProps.fee}
                    isExploreDisabled={pendingModalProps.isExploreDisabled}
                    onExplorePress={pendingModalProps.onExplorePress}
                    submittedAt={pendingModalProps.submittedAt}
                    txid={pendingModalProps.txid}
                    title={
                        <Translation id="moduleTrading.tradingConfirmationScreen.approveTitle" />
                    }
                    vaultName={vaultTokenName}
                    vaultTokenContract={route.params.tokenContract}
                />
            )}
            <YieldDepositInfoBottomSheet
                ref={infoBottomSheetRef}
                apy={apy}
                bonusRewardTokenSymbol={bonusRewardTokenSymbol}
                onClose={handleCloseInfoBottomSheet}
                tokenSymbol={tokenSymbol}
                vaultTokenSymbol={vaultTokenSymbol}
                account={account}
                vault={yieldFlowData.vault}
                wrappedNativeSymbol={wrappedNativeSymbol}
            />
            <YieldDepositApprovalLimitBottomSheet
                ref={approvalLimitBottomSheetRef}
                accountSymbol={account.symbol}
                onApprovalLimitSelect={setApprovalLimitType}
                onClose={closeApprovalLimitBottomSheet}
                selectedApprovalLimitType={approvalLimitType}
                tokenContract={route.params.tokenContract}
                tokenSymbol={tokenSymbol}
            />
        </Screen>
    );
};
