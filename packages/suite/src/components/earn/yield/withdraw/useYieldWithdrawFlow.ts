import { useEffect, useMemo, useState } from 'react';

import type { DexApprovalType } from 'invity-api';

import type { TranslationKey } from '@suite/intl';
import { useTranslation } from '@suite/intl';
import {
    TransactionDtoType,
    useEnterYieldOpportunity,
    useExitYieldOpportunity,
} from '@suite-common/earn-api';
import { toTokenCryptoId, tokenSupportsIncreasingAllowance } from '@suite-common/trading';
import type { Account, AllowanceType } from '@suite-common/wallet-types';
import { getContractAddressForNetworkSymbol, isDecimalsValid } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import type { AllowanceContextValue } from 'src/hooks/wallet/allowance';

import type {
    UseYieldWithdrawFlowResult,
    YieldWithdrawFlowState,
    YieldWithdrawReceiptToken,
    YieldWithdrawToken,
} from '../common/types';
import {
    parseApprovalSpenderFromTransaction,
    parseTransactionToFromTransaction,
} from '../common/yieldAllowanceUtils';
import { normalizeAmountToTokenDecimals } from '../common/yieldAmountUtils';

type ApprovedAmountSummary = {
    type: 'MINIMAL' | 'INFINITE';
    amount: string;
};

const getCurrentStepIndex = (flowStep: YieldWithdrawFlowState['step']) => {
    switch (flowStep) {
        case 'approve':
            return 0;
        case 'withdraw':
            return 1;
        case 'complete':
            return 2;
    }
};

type UseYieldWithdrawFlowArgs = {
    account?: Account;
    allowanceContextValue?: AllowanceContextValue;
    token?: YieldWithdrawToken;
    receiptToken?: YieldWithdrawReceiptToken;
    suppliedAmount?: string | null;
    yieldId?: string;
};

export const useYieldWithdrawFlow = ({
    account,
    allowanceContextValue,
    token,
    receiptToken,
    suppliedAmount,
    yieldId,
}: UseYieldWithdrawFlowArgs): UseYieldWithdrawFlowResult | null => {
    const { translationString } = useTranslation();
    const { mutateAsync: enterYieldOpportunity } = useEnterYieldOpportunity();
    const { mutateAsync: exitYieldOpportunity } = useExitYieldOpportunity();
    const tx = allowanceContextValue?.tx;
    const allowanceState = allowanceContextValue?.state;
    const resolvedSuppliedAmount = suppliedAmount ?? '0';
    const approvalToken = receiptToken?.contractAddress ? receiptToken : token;

    const initialAmount = '';

    const [flowState, setFlowState] = useState<YieldWithdrawFlowState>({
        step: 'approve',
        approveAmount: {
            assetValue: initialAmount,
            receiptTokenValue: initialAmount,
            selectedUnit: 'asset',
        },
        withdrawAmount: '',
    });
    const [approvedAmountSummary, setApprovedAmountSummary] =
        useState<ApprovedAmountSummary | null>(null);
    const [approvalError, setApprovalError] = useState<TranslationKey | null>(null);
    const [approvalSpender, setApprovalSpender] = useState<string | null>(null);
    const [selectedApprovalType, setSelectedApprovalType] = useState<DexApprovalType>('MINIMAL');
    const [isPrepareApprovalLoading, setIsPrepareApprovalLoading] = useState(false);
    const [isRevokeRequired, setIsRevokeRequired] = useState(false);
    const [txApprovalType, setTxApprovalType] = useState<AllowanceType | null>(null);

    const cryptoId = useMemo(
        () =>
            approvalToken?.contractAddress
                ? toTokenCryptoId(
                      approvalToken.networkSymbol,
                      getContractAddressForNetworkSymbol(
                          approvalToken.networkSymbol,
                          approvalToken.contractAddress,
                      ),
                  )
                : null,
        [approvalToken],
    );

    useEffect(() => {
        if (suppliedAmount === null || suppliedAmount === undefined) {
            return;
        }

        if (
            flowState.approveAmount.assetValue !== '' ||
            flowState.approveAmount.receiptTokenValue !== ''
        ) {
            return;
        }

        setFlowState(previousState => ({
            ...previousState,
            approveAmount: {
                ...previousState.approveAmount,
                assetValue: suppliedAmount,
                receiptTokenValue: suppliedAmount,
            },
        }));
    }, [
        flowState.approveAmount.assetValue,
        flowState.approveAmount.receiptTokenValue,
        suppliedAmount,
    ]);

    useEffect(() => {
        if (allowanceState?.isApproveModalOpen) {
            setSelectedApprovalType('MINIMAL');
        }
    }, [allowanceState?.isApproveModalOpen]);

    const currentApproveAmount =
        flowState.approveAmount.selectedUnit === 'asset'
            ? flowState.approveAmount.assetValue
            : flowState.approveAmount.receiptTokenValue;

    const approvedAmount = approvedAmountSummary?.amount ?? flowState.approveAmount.assetValue;
    const isApprovedUnlimited = approvedAmountSummary?.type === 'INFINITE';

    const withdrawMaxAmount = useMemo(() => {
        if (isApprovedUnlimited) {
            return resolvedSuppliedAmount;
        }

        const approvedAmountValue = new BigNumber(approvedAmount);
        const suppliedAmountValue = new BigNumber(resolvedSuppliedAmount);

        if (!approvedAmountValue.isFinite() || approvedAmountValue.lte(0)) {
            return '0';
        }

        return approvedAmountValue.gt(suppliedAmountValue)
            ? suppliedAmountValue.toFixed()
            : approvedAmountValue.toFixed();
    }, [approvedAmount, resolvedSuppliedAmount, isApprovedUnlimited]);

    const getAmountValidationError = (amountValue: string, maxAmount: string) => {
        if (!token) {
            return translationString('TR_GENERIC_ERROR_TITLE');
        }

        if (!amountValue) {
            return translationString('AMOUNT_IS_NOT_SET');
        }

        const amount = new BigNumber(amountValue);

        if (!amount.isFinite()) {
            return translationString('AMOUNT_IS_NOT_SET');
        }

        if (!isDecimalsValid(amountValue, token.decimals)) {
            return translationString('AMOUNT_IS_NOT_IN_RANGE_DECIMALS', {
                decimals: token.decimals,
            });
        }

        if (amount.lte(0)) {
            return translationString('AMOUNT_IS_TOO_LOW');
        }

        if (amount.gt(new BigNumber(maxAmount))) {
            return translationString('AMOUNT_IS_NOT_ENOUGH');
        }

        return null;
    };

    const approveAmountValidationError = getAmountValidationError(
        currentApproveAmount,
        resolvedSuppliedAmount,
    );
    const withdrawAmountValidationError = getAmountValidationError(
        flowState.withdrawAmount,
        withdrawMaxAmount,
    );

    const isIncreasingAllowanceSupported = tokenSupportsIncreasingAllowance(
        token?.contractAddress ?? '',
    );

    useEffect(() => {
        if (tx?.approvalTxid && tx.status.isPending && !txApprovalType && allowanceState) {
            setTxApprovalType(allowanceState.approvalType);
        }
    }, [tx?.approvalTxid, tx?.status.isPending, txApprovalType, allowanceState]);

    useEffect(() => {
        if (!tx || !allowanceState || !tx.approvalTxid) {
            return;
        }

        if (tx.status.isPending) {
            return;
        }

        if (tx.status.isFailed) {
            if (txApprovalType === 'APPROVE' && !isIncreasingAllowanceSupported) {
                setIsRevokeRequired(true);
                setApprovalError(null);
            } else {
                setApprovalError('TR_GENERIC_ERROR_TITLE');
            }

            tx.setApprovalTxid(null);
            setTxApprovalType(null);

            return;
        }

        if (tx.status.isConfirmed && txApprovalType) {
            setApprovalError(null);

            if (txApprovalType === 'APPROVE') {
                if (!approvedAmountSummary) {
                    setApprovedAmountSummary({
                        type: selectedApprovalType === 'INFINITE' ? 'INFINITE' : 'MINIMAL',
                        amount: flowState.approveAmount.assetValue,
                    });
                }

                setFlowState(previousState => ({
                    ...previousState,
                    step: 'withdraw',
                    withdrawAmount: previousState.approveAmount.assetValue,
                }));
            } else {
                setIsRevokeRequired(false);
                setApprovedAmountSummary(null);
                allowanceState.setApprovalType('APPROVE');
                allowanceState.openApproveModal();
                setFlowState(previousState => ({
                    ...previousState,
                    step: 'approve',
                }));
            }

            tx.setApprovalTxid(null);
            setTxApprovalType(null);
        }
    }, [
        allowanceState,
        approvedAmountSummary,
        flowState.approveAmount.assetValue,
        isIncreasingAllowanceSupported,
        selectedApprovalType,
        tx,
        tx?.approvalTxid,
        tx?.status.isConfirmed,
        tx?.status.isFailed,
        tx?.status.isPending,
        txApprovalType,
    ]);

    const handleApproveAmountChange = (amount: string) => {
        if (tx?.approvalTxid && tx.status.isPending) {
            return;
        }

        setApprovalError(null);

        if (flowState.step === 'approve') {
            setApprovalSpender(null);
        }

        setFlowState(previousState => ({
            ...previousState,
            approveAmount: {
                ...previousState.approveAmount,
                assetValue: amount,
                receiptTokenValue: amount,
            },
        }));
    };

    const handleSwitchUnit = () => {
        setFlowState(previousState => ({
            ...previousState,
            approveAmount: {
                ...previousState.approveAmount,
                selectedUnit:
                    previousState.approveAmount.selectedUnit === 'asset' ? 'receiptToken' : 'asset',
            },
        }));
    };

    const handleWithdrawAmountChange = (amount: string) => {
        setFlowState(previousState => ({
            ...previousState,
            withdrawAmount: amount,
        }));
    };

    const handleSelectApprovalType = (approvalType: DexApprovalType) => {
        setSelectedApprovalType(approvalType);
    };

    const handleApproveModalConfirm = () => {
        setApprovedAmountSummary({
            type: selectedApprovalType === 'INFINITE' ? 'INFINITE' : 'MINIMAL',
            amount: flowState.approveAmount.assetValue,
        });
    };

    const handleApprove = async () => {
        if (!tx || !allowanceState || !token || !account) {
            setApprovalError('TR_GENERIC_ERROR_TITLE');

            return;
        }

        if (tx.approvalTxid && tx.status.isPending) {
            return;
        }

        if (approveAmountValidationError) {
            return;
        }

        if (!cryptoId || !yieldId) {
            setApprovalError('TR_GENERIC_ERROR_TITLE');

            return;
        }

        setApprovalError(null);
        setApprovalSpender(null);
        setIsRevokeRequired(false);
        setIsPrepareApprovalLoading(true);

        try {
            allowanceState.setApprovalType('APPROVE');

            const response = receiptToken?.contractAddress
                ? await exitYieldOpportunity({
                      yieldId,
                      address: account.descriptor,
                      amount: normalizeAmountToTokenDecimals(
                          flowState.approveAmount.assetValue,
                          receiptToken.decimals,
                      ),
                  })
                : await enterYieldOpportunity({
                      yieldId,
                      address: account.descriptor,
                      amount: normalizeAmountToTokenDecimals(
                          flowState.approveAmount.assetValue,
                          token.decimals,
                      ),
                      decimals: token.decimals,
                  });

            const approvalTransaction = response.response.data.transactions.find(
                transaction => transaction.type === TransactionDtoType.APPROVAL,
            );
            const withdrawTransaction = response.response.data.transactions.find(
                transaction => transaction.type === TransactionDtoType.WITHDRAW,
            );
            const parsedSpender =
                parseApprovalSpenderFromTransaction(approvalTransaction) ??
                parseTransactionToFromTransaction(withdrawTransaction) ??
                token.approvalSpender;

            if (!parsedSpender) {
                setApprovalError('TR_GENERIC_ERROR_TITLE');

                return;
            }

            setApprovalSpender(parsedSpender);
            allowanceState.openApproveModal();
        } catch {
            setApprovalError('TR_GENERIC_ERROR_TITLE');
        } finally {
            setIsPrepareApprovalLoading(false);
        }
    };

    const handleRevoke = () => {
        if (!allowanceState || !cryptoId || !approvalSpender) {
            setApprovalError('TR_GENERIC_ERROR_TITLE');

            return;
        }

        setApprovalError(null);
        allowanceState.setApprovalType('REVOKE');
        allowanceState.openRevokeModal();
    };

    const completeWithdraw = () => {
        if (withdrawAmountValidationError) {
            return;
        }

        setFlowState(previousState => ({ ...previousState, step: 'complete' }));
    };

    if (!account || !allowanceState || !tx || !token || !receiptToken) {
        return null;
    }

    const isApprovalPending = !!tx.approvalTxid && tx.status.isPending;
    const isApproveButtonLoading = isPrepareApprovalLoading || allowanceState.isWaitingForDevice;
    const isApproveButtonDisabled =
        isPrepareApprovalLoading ||
        allowanceState.isWaitingForDevice ||
        isApprovalPending ||
        !!approveAmountValidationError;
    const isAmountInputDisabled =
        isPrepareApprovalLoading || allowanceState.isWaitingForDevice || isApprovalPending;

    return {
        flow: {
            approveAmount: flowState.approveAmount,
            withdrawAmount: flowState.withdrawAmount,
            cryptoId,
            currentStepIndex: getCurrentStepIndex(flowState.step),
            isCompleteStep: flowState.step === 'complete',
        },
        approveStep: {
            amountError: approveAmountValidationError,
        },
        withdrawStep: {
            approvedAmount,
            amountError: withdrawAmountValidationError,
            isApprovedUnlimited,
            isDisabled: !!withdrawAmountValidationError,
            maxAmount: withdrawMaxAmount,
        },
        approve: {
            error: approvalError,
            isAmountInputDisabled,
            isApproveButtonDisabled,
            isApproveButtonLoading,
        },
        approval: {
            selectedType: selectedApprovalType,
            spender: approvalSpender,
            txid: tx.approvalTxid,
            pendingType: txApprovalType,
            isPending: isApprovalPending,
            isRevokeRequired,
        },
        complete: {
            input: {
                token: receiptToken,
                value: `${flowState.withdrawAmount} ${receiptToken.symbol}`,
            },
            output: {
                token,
                value: `${flowState.withdrawAmount} ${token.symbol}`,
            },
        },
        completeWithdraw,
        handleApproveAmountChange,
        handleApprove,
        handleApproveModalConfirm,
        handleSelectApprovalType,
        handleRevoke,
        handleSwitchUnit,
        handleWithdrawAmountChange,
    };
};
