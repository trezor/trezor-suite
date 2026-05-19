import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import { type RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';

import { useFormatters } from '@suite-common/formatters';
import { getNetwork, getNetworkType } from '@suite-common/wallet-config';
import {
    initYieldAllowanceThunk,
    splitYieldPendingTransaction,
    stablecoinYieldActions,
} from '@suite-common/wallet-core';
import { Box, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import {
    Screen,
    type StackNavigationProps,
    type YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';
import { FeeSummaryCard, useTransactionDetails } from '@suite-native/transaction-management';

import { YieldPendingTransactionModal } from '../components/YieldPendingTransactionModal';
import { YieldSupplyAmountInputCard } from '../components/YieldSupplyAmountInputCard';
import { YieldSupplyApprovedAmountCard } from '../components/YieldSupplyApprovedAmountCard';
import { YieldSupplyFlowFooter } from '../components/YieldSupplyFlowFooter';
import { YieldSupplyFlowScreenHeader } from '../components/YieldSupplyFlowScreenHeader';
import { YieldSupplyInfoBottomSheet } from '../components/YieldSupplyInfoBottomSheet';
import { YieldSupplyStepCard } from '../components/YieldSupplyStepCard';
import { YieldSupplyTxSimulationBottomSheet } from '../components/YieldSupplyTxSimulationBottomSheet';
import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';
import { useYieldSession } from '../hooks/useYieldSession';
import { type PreparedYieldSupplyAction, useYieldSupplyFees } from '../hooks/useYieldSupplyFees';
import { useYieldSupplyForm } from '../hooks/useYieldSupplyForm';
import { useYieldSupplySubmit } from '../hooks/useYieldSupplySubmit';
import {
    isYieldApprovalAllowanceEnough,
    isYieldApprovalAllowanceUnlimited,
} from '../yieldApprovalUtils';

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldSupply>;
type NavigationProps = StackNavigationProps<YieldStackParamList, YieldStackRoutes.YieldSupply>;

export const YieldSupplyScreen = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProps>();
    const dispatch = useDispatch();
    const isFocused = useIsFocused();
    const { CryptoAmountFormatter } = useFormatters();
    const {
        bottomSheetRef: infoBottomSheetRef,
        closeModal: closeInfoBottomSheet,
        openModal: openInfoBottomSheet,
    } = useBottomSheetModal();
    const {
        bottomSheetRef: simulationBottomSheetRef,
        closeModal: closeSimulationBottomSheet,
        openModal: openSimulationBottomSheet,
    } = useBottomSheetModal();
    const {
        bottomSheetRef: pendingBottomSheetRef,
        closeModal: closePendingBottomSheet,
        openModal: openPendingBottomSheet,
    } = useBottomSheetModal();
    const [simulationPreparedAction, setSimulationPreparedAction] =
        useState<PreparedYieldSupplyAction | null>(null);
    const {
        account,
        apy,
        flowData,
        flowKey,
        token,
        tokenSymbol,
        vault,
        vaultTokenName,
        resolutionStatus,
    } = useResolvedYieldFlowData(route.params);
    const session = useYieldSession({
        flowKey,
        flowType: 'deposit',
    });
    const supplyAmount = session?.action.amount;
    const allowanceAmount = session?.approval.allowanceAmount;
    const allowanceStatus = session?.approval.allowanceStatus;
    const pendingTransaction = session?.action.pendingTransaction ?? null;
    const { actionPendingTransaction } = splitYieldPendingTransaction(
        pendingTransaction,
        'deposit',
    );
    const isSupplyPending = !!actionPendingTransaction;
    const isActionSubmitting = session?.action.isSubmitting ?? false;
    const isApprovedAmountUnlimited = isYieldApprovalAllowanceUnlimited({ session, token });
    const isAllowanceLoaded = allowanceStatus === 'loaded';
    const isSupplySessionReady = session?.step === 'action' && !!supplyAmount && isAllowanceLoaded;
    const shouldRefreshAllowance = resolutionStatus === 'resolved' && allowanceStatus === 'idle';
    const supplyForm = useYieldSupplyForm({
        defaultAmount: supplyAmount,
        token,
        tokenSymbol,
    });
    const { amountValue, form, handleAmountChange, handleMaxChange, isMaxSelected } = supplyForm;
    const {
        formState: { isValid },
    } = form;
    const isApprovalIncreaseRequired =
        isAllowanceLoaded &&
        !isYieldApprovalAllowanceEnough({
            amount: amountValue,
            session,
            token,
        });
    const isSubmitDisabled =
        isSupplyPending || !isSupplySessionReady || !isValid || !amountValue || isActionSubmitting;
    const supplyFee = useYieldSupplyFees({
        amount: amountValue,
        flowData,
        flowKey,
        isEnabled:
            isSupplySessionReady && isValid && !isApprovalIncreaseRequired && !isSupplyPending,
    });
    const { explorerUrl, openInBlockchain } = useTransactionDetails({
        accountKey: account?.key ?? null,
        txid: actionPendingTransaction?.txid ?? null,
    });

    useEffect(() => {
        if (shouldRefreshAllowance) {
            void dispatch(
                initYieldAllowanceThunk({
                    flowData,
                    flowKey,
                    flowType: 'deposit',
                    // Mobile supply screen only refreshes display/guards here.
                    shouldSkipApprovalStep: false,
                }),
            );
        }
    }, [dispatch, flowData, flowKey, shouldRefreshAllowance]);

    const formattedApprovedAmount = useMemo(() => {
        if (!allowanceAmount || !tokenSymbol || isApprovedAmountUnlimited) {
            return null;
        }

        return CryptoAmountFormatter.format(allowanceAmount, {
            symbol: tokenSymbol,
            isBalance: true,
            withSymbol: true,
            isEllipsisAppended: false,
            maxDisplayedDecimals: 8,
        });
    }, [CryptoAmountFormatter, isApprovedAmountUnlimited, allowanceAmount, tokenSymbol]);

    const handleEditApproval = useCallback(() => {
        if (!flowKey || isSupplyPending) {
            return;
        }

        dispatch(stablecoinYieldActions.enterModifyMode({ flowType: 'deposit', flowKey }));
        navigation.goBack();
    }, [dispatch, flowKey, isSupplyPending, navigation]);
    const handleActionReady = useCallback(
        (preparedAction: PreparedYieldSupplyAction) => {
            setSimulationPreparedAction(preparedAction);
            requestAnimationFrame(openSimulationBottomSheet);
        },
        [openSimulationBottomSheet],
    );
    const handleConfirmSimulation = useCallback(() => {
        if (!flowKey || !simulationPreparedAction) {
            return;
        }

        dispatch(
            stablecoinYieldActions.storeActionReviewData({
                amount: simulationPreparedAction.amount,
                flowKey,
                flowType: 'deposit',
                receiptAmount: simulationPreparedAction.receiptAmount,
                unsignedTransaction: simulationPreparedAction.unsignedTransaction,
            }),
        );
        closeSimulationBottomSheet();
        navigation.navigate(YieldStackRoutes.YieldSupplyReview, route.params);
    }, [
        closeSimulationBottomSheet,
        dispatch,
        flowKey,
        navigation,
        route.params,
        simulationPreparedAction,
    ]);
    const { handleSubmitSupply } = useYieldSupplySubmit({
        amount: amountValue,
        flowData,
        flowKey,
        onActionReady: handleActionReady,
        onApprovalRequired: handleEditApproval,
        preparedAction: supplyFee.preparedAction,
    });

    const handleContinue = useCallback(() => {
        if (isSupplyPending) {
            return;
        }

        if (isApprovalIncreaseRequired) {
            handleEditApproval();

            return;
        }

        void handleSubmitSupply();
    }, [handleEditApproval, handleSubmitSupply, isApprovalIncreaseRequired, isSupplyPending]);
    const footerTranslationId = isApprovalIncreaseRequired
        ? 'earn.yieldSupplyFlowScreen.increaseApprovalLimit'
        : undefined;

    const handleCloseInfoBottomSheet = useCallback(() => {
        closeInfoBottomSheet();

        if (isSupplyPending) {
            requestAnimationFrame(openPendingBottomSheet);
        }
    }, [closeInfoBottomSheet, isSupplyPending, openPendingBottomSheet]);

    useEffect(() => {
        if (!isFocused || !isSupplyPending) {
            closePendingBottomSheet();

            return;
        }

        openPendingBottomSheet();
    }, [closePendingBottomSheet, isFocused, isSupplyPending, openPendingBottomSheet]);

    if (resolutionStatus !== 'resolved' || !isSupplySessionReady) {
        return null;
    }

    const networkType = getNetworkType(account.symbol);
    const accountLabel = account.accountLabel ?? getNetwork(account.symbol).name;

    return (
        <Screen
            noHorizontalPadding
            header={
                <YieldSupplyFlowScreenHeader
                    account={account}
                    closeAction={handleEditApproval}
                    onInfoPress={openInfoBottomSheet}
                    tokenContract={route.params.tokenContract}
                    vaultName={vault.metadata.name}
                />
            }
            footer={
                <YieldSupplyFlowFooter
                    amountValue={amountValue}
                    apy={apy}
                    buttonTranslationId={footerTranslationId}
                    isDisabled={isSubmitDisabled}
                    isLoading={isActionSubmitting}
                    onPress={handleContinue}
                    tokenSymbol={tokenSymbol}
                />
            }
        >
            <Box pointerEvents={isSupplyPending ? 'none' : 'auto'}>
                <VStack spacing="sp16">
                    <YieldSupplyStepCard currentStepIndex={1} />

                    <Box paddingHorizontal="sp16">
                        <YieldSupplyApprovedAmountCard
                            approvedAmount={formattedApprovedAmount}
                            isApprovedAmountUnlimited={isApprovedAmountUnlimited}
                            networkSymbol={account.symbol}
                            onEditApprovalPress={handleEditApproval}
                            tokenContract={route.params.tokenContract}
                        />
                    </Box>

                    <Box paddingHorizontal="sp16">
                        <Form form={form}>
                            <YieldSupplyAmountInputCard
                                balance={token.balance}
                                isMaxSelected={isMaxSelected}
                                onAmountChange={handleAmountChange}
                                onMaxChange={handleMaxChange}
                                tokenSymbol={tokenSymbol}
                            />
                        </Form>
                    </Box>

                    {!isApprovalIncreaseRequired && (
                        <Box paddingHorizontal="sp16">
                            <FeeSummaryCard
                                fee={supplyFee.feePreview?.fee ?? null}
                                symbol={account.symbol}
                                networkType={networkType}
                                areFeesLoading={supplyFee.isPreparingSupplyFee}
                                testID="@earn/yield-supply-fee-preview-card"
                            />
                        </Box>
                    )}
                </VStack>
            </Box>

            {actionPendingTransaction && (
                <YieldPendingTransactionModal
                    ref={pendingBottomSheetRef}
                    accountLabel={accountLabel}
                    accountSymbol={account.symbol}
                    amount={actionPendingTransaction.amount}
                    amountLabel={<Translation id="earn.yieldSupplyFlowScreen.amountToSupply" />}
                    amountTokenContract={route.params.tokenContract}
                    amountTokenSymbol={tokenSymbol}
                    fee={actionPendingTransaction.fee}
                    isExploreDisabled={!explorerUrl}
                    onExplorePress={openInBlockchain}
                    submittedAt={new Date(actionPendingTransaction.submittedAt ?? 0)}
                    title={<Translation id="earn.yieldSupplyFlowScreen.supplyPendingTitle" />}
                    vaultName={vault.metadata.name}
                    vaultTokenContract={route.params.tokenContract}
                />
            )}

            <YieldSupplyInfoBottomSheet
                ref={infoBottomSheetRef}
                apy={apy}
                onClose={handleCloseInfoBottomSheet}
                tokenSymbol={tokenSymbol}
                vaultTokenName={vaultTokenName}
            />
            {simulationPreparedAction && (
                <YieldSupplyTxSimulationBottomSheet
                    ref={simulationBottomSheetRef}
                    account={account}
                    onCancel={closeSimulationBottomSheet}
                    onConfirm={handleConfirmSimulation}
                    preparedAction={simulationPreparedAction}
                />
            )}
        </Screen>
    );
};
