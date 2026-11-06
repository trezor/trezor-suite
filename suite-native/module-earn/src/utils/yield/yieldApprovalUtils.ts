import { type TokenAddress } from '@suite-common/tokens';
import {
    type YieldApproveModalState,
    type YieldFlowToken,
    type YieldSessionState,
} from '@suite-common/wallet-core';
import {
    type AllowanceLimitType,
    type FeeLevelLabel,
    type FormState,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { getAllowanceAmountForLimit, isAllowanceUnlimited } from '@suite-common/wallet-utils';

type BuildYieldAllowanceFormStateParams = {
    approvalModalState: YieldApproveModalState;
    data: string;
    precomposedTransaction?: PrecomposedTransactionFinal;
    selectedFee: FeeLevelLabel;
};

type YieldAllowanceFeeState = {
    customFee:
        | {
              feeLimit: string;
              feePerUnit: string;
              maxFeePerGas?: string;
              maxPriorityFeePerGas?: string;
          }
        | undefined;
    selectedFee: FeeLevelLabel;
};

type GetYieldApprovalAllowanceAmountParams = {
    amount: string;
    approvalLimitType: AllowanceLimitType;
    tokenContract: TokenAddress;
    tokenDecimals: number;
    tokenSymbol: string;
};

type IsYieldApprovalAllowanceUnlimitedParams = {
    session: YieldSessionState | null | undefined;
    token: YieldFlowToken | null | undefined;
};

export const buildYieldAllowanceFormState = ({
    approvalModalState,
    data,
    precomposedTransaction,
    selectedFee,
}: BuildYieldAllowanceFormStateParams): FormState => ({
    outputs: [
        {
            type: 'payment',
            address: approvalModalState.contractAddress,
            amount: '0',
            fiat: '',
            currency: { label: '', value: '' },
            token: approvalModalState.contractAddress,
        },
    ],
    selectedFee,
    feePerUnit: precomposedTransaction?.feePerByte ?? '',
    feeLimit: precomposedTransaction?.feeLimit ?? '',
    maxFeePerGas: precomposedTransaction?.maxFeePerGas,
    maxPriorityFeePerGas: precomposedTransaction?.maxPriorityFeePerGas,
    options: ['broadcast', 'transactionData'],
    transactionData: data,
    isCoinControlEnabled: false,
    hasCoinControlBeenOpened: false,
    selectedUtxos: [],
});

export const getYieldAllowanceFeeState = (
    formDraft: FormState | null | undefined,
): YieldAllowanceFeeState => {
    const selectedFee: FeeLevelLabel =
        formDraft?.selectedFee === 'custom' && (!formDraft.feeLimit || !formDraft.feePerUnit)
            ? 'normal'
            : (formDraft?.selectedFee ?? 'normal');

    if (selectedFee !== 'custom' || !formDraft?.feeLimit || !formDraft.feePerUnit) {
        return {
            customFee: undefined,
            selectedFee,
        };
    }

    return {
        customFee: {
            feeLimit: formDraft.feeLimit,
            feePerUnit: formDraft.feePerUnit,
            maxFeePerGas: formDraft.maxFeePerGas,
            maxPriorityFeePerGas: formDraft.maxPriorityFeePerGas,
        },
        selectedFee,
    };
};

export const getYieldApprovalAllowanceAmount = ({
    amount,
    approvalLimitType,
    tokenContract,
    tokenDecimals,
    tokenSymbol,
}: GetYieldApprovalAllowanceAmountParams) =>
    getAllowanceAmountForLimit({
        amount,
        limitType: approvalLimitType,
        token: {
            contract: tokenContract,
            decimals: tokenDecimals,
            symbol: tokenSymbol,
            standard: 'ERC20',
        },
    }).allowanceAmount;

export const isYieldApprovalAllowanceUnlimited = ({
    session,
    token,
}: IsYieldApprovalAllowanceUnlimitedParams): boolean => {
    const allowanceAmount = session?.approval.allowanceAmount;

    if (!allowanceAmount || token?.decimals === undefined) {
        return false;
    }

    return isAllowanceUnlimited({ amount: allowanceAmount, decimals: token.decimals });
};
