import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { splitYieldPendingTransaction } from '@suite-common/wallet-core';
import { Banner, Button, Column, type StepListItemState, Switch, Text } from '@trezor/components';

import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';

import { useYieldDepositContext } from './useYieldDepositContext';
import { YieldActionStep } from '../common/YieldActionStep';
import { YieldActionStepWarning } from '../common/YieldActionStepWarning';
import { YieldApproveModal } from '../common/YieldApproveModal';
import { YieldApproveStep } from '../common/YieldApproveStep';
import { YieldApprovedAmountCard } from '../common/YieldApprovedAmountCard';
import { YieldFlowCompleteDeposit } from '../common/YieldFlowCompleteDeposit';
import { YieldFlowStepList } from '../common/YieldFlowStepList';
import { YieldWrapStep } from '../common/YieldWrapStep';
import { getApyBreakdown } from '../yieldFlowUtils';

// Wrapped-native deposits gain a leading wrap step that is not part of the deposit
// sequence — it is stitched into the rendered list explicitly.
const WRAP_FLOW_LIST_STEPS = ['wrap', 'approve', 'action'] as const;

export const YieldDepositForm = () => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);

    const {
        account,
        vault,
        token,
        receiptToken,
        apy,
        completedAmount,
        completedReceiptAmount,
        maxAmount,
        errorMessage,
        approveModalState,
        pendingTransaction,
        allowanceAmount,
        allowanceStatus,
        approvalAction,
        canRevokeAllowance,
        isAmountEmpty,
        isAmountTooHigh,
        isAmountInvalidDecimals,
        isApprovalInsufficient,
        isSubmittingApprove,
        isSubmittingAction,
        isWrapFlow,
        isWrapInsufficient,
        isWrapReserveKept,
        isWrapConfirmed,
        nativeBalance,
        liveAmount,
        isSubmittingWrap,
        setAmountInput,
        submitApprovalAction,
        submitWrap,
        enableWrapStep,
        disableWrapStep,
        goToWrapStep,
        submitAction,
        revokeAllowance,
        enterModifyApproval,
        handleApproveModalCancel,
        handleApproveSuccessTxid,
        openPendingTransaction,
        retryInitAllowance,
        flow,
    } = useYieldDepositContext();

    const {
        approvalPendingTransaction,
        actionPendingTransaction: depositPendingTransaction,
        wrapPendingTransaction,
    } = splitYieldPendingTransaction(pendingTransaction, 'deposit');

    const nativeSymbol = getNetworkDisplaySymbol(account.symbol);
    const isWrapStepActive = flow.currentStep === 'wrap';
    // The wrap step stays visible as step 1 even when disabled: active while editing, a green
    // check once a wrap confirmed, otherwise a dimmed (pending) placeholder.
    const getWrapStepState = (): StepListItemState => {
        if (isWrapStepActive) {
            return 'active';
        }
        if (isWrapConfirmed) {
            return 'done';
        }

        return 'pending';
    };
    const wrapStepState = getWrapStepState();

    const handleOnApprovalSubmit = () => {
        analytics.report({
            type: events.yieldDepositEvent.name,
            payload: {
                type: approvalAction === 'revoke' ? 'revoke' : 'approve',
                action: 'continue',
                networkSymbol: token.networkSymbol,
                vaultId: vault.id,
            },
        });

        submitApprovalAction();
    };

    const handleOnRevoke = () => {
        analytics.report({
            type: events.yieldDepositEvent.name,
            payload: {
                type: 'revoke',
                action: 'continue',
                networkSymbol: token.networkSymbol,
                vaultId: vault.id,
            },
        });

        revokeAllowance();
    };

    const handleOnModify = () => {
        analytics.report({
            type: events.yieldDepositEvent.name,
            payload: {
                type: 'modify-allowance',
                action: 'continue',
                networkSymbol: token.networkSymbol,
                vaultId: vault.id,
            },
        });

        enterModifyApproval();
    };

    const handleOnWrap = () => {
        analytics.report({
            type: events.yieldDepositEvent.name,
            payload: {
                type: 'wrap',
                action: 'continue',
                networkSymbol: token.networkSymbol,
                vaultId: vault.id,
            },
        });

        submitWrap();
    };

    const handleWrapToggle = (isEnabled: boolean) => {
        if (isEnabled) {
            enableWrapStep();
        } else {
            disableWrapStep();
        }
    };

    const handleOnDeposit = () => {
        const apyBreakdown = getApyBreakdown(vault.rewardRate?.components);
        analytics.report({
            type: events.yieldDepositEvent.name,
            payload: {
                type: 'deposit',
                action: 'continue',
                networkSymbol: token.networkSymbol,
                vaultId: vault.id,
                ...(apyBreakdown && { apyBreakdown }),
            },
        });

        submitAction();
    };

    const handleMaxClick = () => {
        analytics.report({
            type: events.yieldInteractionEvent.name,
            payload: {
                element: 'deposit-max',
                networkSymbol: token.networkSymbol,
                vaultId: vault.id,
            },
        });

        setAmountInput(maxAmount);
    };

    const handleRetryAllowance = () => {
        analytics.report({
            type: events.yieldInteractionEvent.name,
            payload: {
                element: 'allowance-retry',
                networkSymbol: token.networkSymbol,
                vaultId: vault.id,
            },
        });

        retryInitAllowance();
    };

    const modifyButton = (
        <Button size="small" intent="neutral" priority="secondary" onClick={handleOnModify}>
            <Translation id="TR_MODIFY" />
        </Button>
    );

    const renderApproveStep = () => (
        <YieldApproveStep
            token={token}
            summaryValue={<FormattedCryptoAmount value={maxAmount} symbol={token.symbol} />}
            approvedAmount={allowanceAmount || undefined}
            isApprovedAmountLoading={allowanceStatus === 'loading'}
            hasApprovedAmountError={allowanceStatus === 'error'}
            approvalAction={approvalAction}
            canRevokeAllowance={canRevokeAllowance}
            warning={
                !isAmountInvalidDecimals && (isWrapInsufficient || isAmountTooHigh) ? (
                    <YieldActionStepWarning
                        isWrapInsufficient={isWrapInsufficient}
                        tokenSymbol={token.symbol}
                        onWrapMore={goToWrapStep}
                        isApproveOverBalance={isAmountTooHigh}
                    />
                ) : undefined
            }
            isDisabled={
                isAmountEmpty ||
                isAmountInvalidDecimals ||
                isWrapInsufficient ||
                isSubmittingApprove ||
                !!approvalPendingTransaction
            }
            isLoading={isSubmittingApprove}
            pendingApproveTransaction={approvalPendingTransaction}
            onMaxClick={handleMaxClick}
            onApprovalSubmit={handleOnApprovalSubmit}
            onRevoke={handleOnRevoke}
            onPendingTxClick={openPendingTransaction}
        />
    );

    // The approved-amount card only belongs to steps that already passed approval, never
    // while the wrap step (step 1) is still active.
    const renderApproveInactive = (state: StepListItemState) =>
        state === 'done' ? (
            <YieldApprovedAmountCard
                token={token}
                amount={allowanceAmount || '0'}
                isLoading={allowanceStatus === 'loading'}
                hasError={allowanceStatus === 'error'}
            />
        ) : null;

    const renderActionStep = () => (
        <YieldActionStep
            flowType="deposit"
            token={token}
            summaryValue={<FormattedCryptoAmount value={maxAmount} symbol={token.symbol} />}
            warning={
                !isAmountInvalidDecimals ? (
                    <YieldActionStepWarning
                        isWrapInsufficient={isWrapInsufficient}
                        tokenSymbol={token.symbol}
                        onWrapMore={goToWrapStep}
                        isInsufficientFunds={isAmountTooHigh}
                        isApprovalInsufficient={isApprovalInsufficient}
                        onModifyApproval={handleOnModify}
                    />
                ) : undefined
            }
            isDisabled={
                isAmountEmpty ||
                isAmountTooHigh ||
                isAmountInvalidDecimals ||
                isWrapInsufficient ||
                isApprovalInsufficient ||
                isSubmittingAction ||
                !!depositPendingTransaction
            }
            isPending={isSubmittingAction}
            pendingTransaction={depositPendingTransaction}
            onMaxClick={handleMaxClick}
            onSubmit={handleOnDeposit}
            onPendingTxClick={openPendingTransaction}
        />
    );

    const renderComplete = () => (
        <YieldFlowCompleteDeposit
            apy={apy}
            vault={vault}
            networkSymbol={account.symbol}
            input={{ token, amount: completedAmount }}
            output={{ token: receiptToken, amount: completedReceiptAmount }}
        />
    );

    return (
        <>
            <Column width="100%" alignItems="center">
                <Column gap={24} width="100%" maxWidth={500}>
                    {flow.currentStep !== 'complete' && (
                        <>
                            <Text typographyStyle="headline-md">
                                <Translation id="TR_EARN_YIELD_DEPOSIT" />
                            </Text>

                            {errorMessage && (
                                <Banner
                                    intent="warning"
                                    description={<Translation id={errorMessage} />}
                                />
                            )}

                            {allowanceStatus === 'error' && (
                                <Banner
                                    icon
                                    intent="warning"
                                    description={
                                        <Translation id="TR_EARN_YIELD_ALLOWANCE_FETCH_FAILED" />
                                    }
                                    rightContent={
                                        <Banner.Button onClick={handleRetryAllowance}>
                                            <Translation id="TR_RETRY" />
                                        </Banner.Button>
                                    }
                                />
                            )}
                        </>
                    )}

                    <YieldFlowStepList
                        flowType="deposit"
                        currentStep={flow.currentStep}
                        hasStepList
                        listSteps={isWrapFlow ? WRAP_FLOW_LIST_STEPS : undefined}
                        steps={{
                            ...(isWrapFlow && {
                                wrap: {
                                    title: (
                                        <Translation
                                            id="TR_EARN_YIELD_WRAP_STEP_TITLE"
                                            values={{ nativeSymbol, tokenSymbol: token.symbol }}
                                        />
                                    ),
                                    state: wrapStepState,
                                    rightContent: () =>
                                        wrapStepState === 'done' ? undefined : (
                                            <Switch
                                                isChecked={isWrapStepActive}
                                                isDisabled={
                                                    isSubmittingWrap || !!wrapPendingTransaction
                                                }
                                                onChange={handleWrapToggle}
                                            />
                                        ),
                                    content: () => (
                                        <YieldWrapStep
                                            token={token}
                                            nativeSymbol={nativeSymbol}
                                            nativeBalanceValue={
                                                <FormattedCryptoAmount
                                                    value={nativeBalance}
                                                    symbol={nativeSymbol}
                                                />
                                            }
                                            wrapAmount={liveAmount || '0'}
                                            showReserveNotice={isWrapReserveKept}
                                            warning={
                                                !isAmountInvalidDecimals && isAmountTooHigh ? (
                                                    <YieldActionStepWarning
                                                        isInsufficientFunds={isAmountTooHigh}
                                                    />
                                                ) : undefined
                                            }
                                            isDisabled={
                                                isAmountEmpty ||
                                                isAmountTooHigh ||
                                                isAmountInvalidDecimals ||
                                                isSubmittingWrap
                                            }
                                            isLoading={isSubmittingWrap}
                                            pendingTransaction={wrapPendingTransaction}
                                            onMaxClick={handleMaxClick}
                                            onSubmit={handleOnWrap}
                                            onPendingTxClick={openPendingTransaction}
                                        />
                                    ),
                                },
                            }),
                            approve: {
                                title: <Translation id="TR_EARN_YIELD_SELECT_AMOUNT_AND_APPROVE" />,
                                rightContent: view =>
                                    view.state === 'done' ? modifyButton : undefined,
                                content: renderApproveStep,
                                inactiveContent: view => renderApproveInactive(view.state),
                            },
                            action: {
                                title: <Translation id="TR_EARN_YIELD_DEPOSIT" />,
                                content: renderActionStep,
                            },
                            complete: {
                                isListItem: false,
                                content: renderComplete,
                            },
                        }}
                    />
                </Column>
            </Column>

            {approveModalState && (
                <YieldApproveModal
                    {...approveModalState}
                    account={account}
                    vaultId={vault.id}
                    onCancel={handleApproveModalCancel}
                    onSuccess={handleApproveSuccessTxid}
                    preapprovedAmount={allowanceAmount}
                />
            )}
        </>
    );
};
