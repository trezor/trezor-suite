import { useEffect, useMemo, useState } from 'react';

import type { DexApprovalType } from 'invity-api';

import type { TranslationKey } from '@suite/intl';
import { useTranslation } from '@suite/intl';
import { TransactionDtoType, useEnterYieldOpportunity } from '@suite-common/earn-api';
import { toTokenCryptoId, tokenSupportsIncreasingAllowance } from '@suite-common/trading';
import type { Account, AllowanceType } from '@suite-common/wallet-types';
import { getContractAddressForNetworkSymbol, isDecimalsValid } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import type { AllowanceContextValue } from 'src/hooks/wallet/allowance';

import type {
    UseYieldSupplyFlowResult,
    YieldSupplyAvailableToken,
    YieldSupplyFlowState,
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

const getCurrentStepIndex = (flowStep: YieldSupplyFlowState['step']) => {
    switch (flowStep) {
        case 'approve':
            return 0;
        case 'supply':
            return 1;
        case 'complete':
            return 2;
    }
};

type UseYieldSupplyFlowArgs = {
    account?: Account;
    allowanceContextValue?: AllowanceContextValue;
    token?: YieldSupplyAvailableToken;
    yieldId?: string;
};

export const useYieldSupplyFlow = ({
    account,
    allowanceContextValue,
    token,
    yieldId,
}: UseYieldSupplyFlowArgs): UseYieldSupplyFlowResult | null => {
    const { translationString } = useTranslation();
    const { mutateAsync: enterYieldOpportunity } = useEnterYieldOpportunity();
    const tx = allowanceContextValue?.tx;
    const allowanceState = allowanceContextValue?.state;

    const initialAmount = token?.balance ?? '';

    const [flowState, setFlowState] = useState<YieldSupplyFlowState>({
        step: 'approve',
        amount: initialAmount,
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
            token
                ? toTokenCryptoId(
                      token.networkSymbol,
                      getContractAddressForNetworkSymbol(
                          token.networkSymbol,
                          token.contractAddress,
                      ),
                  )
                : null,
        [token],
    );

    useEffect(() => {
        if (token && flowState.amount === '') {
            setFlowState(previousState => ({
                ...previousState,
                amount: token.balance,
            }));
        }
    }, [token, flowState.amount]);

    useEffect(() => {
        if (allowanceState?.isApproveModalOpen) {
            setSelectedApprovalType('MINIMAL');
        }
    }, [allowanceState?.isApproveModalOpen]);

    const approvedAmount = approvedAmountSummary?.amount ?? flowState.amount;
    const isApprovedUnlimited = approvedAmountSummary?.type === 'INFINITE';

    const supplyMaxAmount = useMemo(() => {
        if (isApprovedUnlimited) {
            return token?.balance ?? '0';
        }

        const approvedAmountValue = new BigNumber(approvedAmount);
        const balanceValue = new BigNumber(token?.balance ?? '0');

        if (!approvedAmountValue.isFinite() || approvedAmountValue.lte(0)) {
            return '0';
        }

        return approvedAmountValue.gt(balanceValue)
            ? balanceValue.toFixed()
            : approvedAmountValue.toFixed();
    }, [approvedAmount, token?.balance, isApprovedUnlimited]);

    const getAmountValidationError = (maxAmount: string) => {
        if (!token) {
            return translationString('TR_GENERIC_ERROR_TITLE');
        }

        if (!flowState.amount) {
            return translationString('AMOUNT_IS_NOT_SET');
        }

        const amount = new BigNumber(flowState.amount);

        if (!amount.isFinite()) {
            return translationString('AMOUNT_IS_NOT_SET');
        }

        if (!isDecimalsValid(flowState.amount, token.decimals)) {
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

    const approveAmountValidationError = getAmountValidationError(token?.balance ?? '0');
    const supplyAmountValidationError = getAmountValidationError(supplyMaxAmount);

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
                        type: 'MINIMAL',
                        amount: flowState.amount,
                    });
                }

                setFlowState(previousState => ({ ...previousState, step: 'supply' }));
            } else {
                setIsRevokeRequired(false);
                setApprovedAmountSummary(null);
                allowanceState.setApprovalType('APPROVE');
                allowanceState.openApproveModal();
            }

            tx.setApprovalTxid(null);
            setTxApprovalType(null);
        }
    }, [
        tx?.approvalTxid,
        tx?.status.isPending,
        tx?.status.isFailed,
        tx?.status.isConfirmed,
        txApprovalType,
        approvedAmountSummary,
        flowState.amount,
        isIncreasingAllowanceSupported,
        tx,
        allowanceState,
    ]);

    const handleAmountChange = (amount: string) => {
        if (tx?.approvalTxid && tx.status.isPending) {
            return;
        }

        setApprovalError(null);

        if (flowState.step === 'approve') {
            setApprovalSpender(null);
        }

        setFlowState(previousState => ({
            ...previousState,
            amount,
        }));
    };

    const handleSelectApprovalType = (approvalType: DexApprovalType) => {
        setSelectedApprovalType(approvalType);
    };

    const handleApproveModalConfirm = () => {
        setApprovedAmountSummary({
            type: selectedApprovalType === 'INFINITE' ? 'INFINITE' : 'MINIMAL',
            amount: flowState.amount,
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

            const response = await enterYieldOpportunity({
                yieldId,
                address: account.descriptor,
                amount: normalizeAmountToTokenDecimals(flowState.amount, token.decimals),
                decimals: token.decimals,
            });

            const approvalTransaction = response.response.data.transactions.find(
                transaction => transaction.type === TransactionDtoType.APPROVAL,
            );
            const supplyTransaction = response.response.data.transactions.find(
                transaction =>
                    transaction.type === TransactionDtoType.SUPPLY ||
                    transaction.type === TransactionDtoType.DEPOSIT,
            );
            const parsedSpender =
                parseApprovalSpenderFromTransaction(approvalTransaction) ??
                parseTransactionToFromTransaction(supplyTransaction) ??
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

    const completeSupply = () => {
        if (supplyAmountValidationError) {
            return;
        }

        setFlowState(previousState => ({ ...previousState, step: 'complete' }));
    };

    if (!account || !allowanceState || !tx || !token) {
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
            amount: flowState.amount,
            cryptoId,
            currentStepIndex: getCurrentStepIndex(flowState.step),
            isCompleteStep: flowState.step === 'complete',
        },
        approveStep: {
            amountError: approveAmountValidationError,
        },
        supplyStep: {
            approvedAmount,
            amountError: supplyAmountValidationError,
            isApprovedUnlimited,
            isDisabled: !!supplyAmountValidationError,
            maxAmount: supplyMaxAmount,
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
                token,
                value: `${flowState.amount} ${token.symbol}`,
            },
            output: {
                token,
                value: '99 xyzSteakUSDC',
            },
        },
        completeSupply,
        handleAmountChange,
        handleApprove,
        handleApproveModalConfirm,
        handleSelectApprovalType,
        handleRevoke,
    };
};
