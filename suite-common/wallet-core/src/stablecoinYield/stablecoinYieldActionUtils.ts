import { fromWei } from 'web3-utils';

import {
    type TransactionDto,
    parseUnsignedEvmTransactionForSigning,
} from '@suite-common/earn-stablecoin-api';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type FormState,
    type PrecomposedTransactionFinal,
    type YieldFormMetadata,
} from '@suite-common/wallet-types';
import {
    convertAmountUnitsToSubunits,
    getContractAddressForNetworkSymbol,
} from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/connect';
import { exhaustive } from '@trezor/type-utils';

import {
    type YieldFlowResolvedData,
    getApprovalRequestAmount,
    submitYieldOpportunity,
} from './stablecoinYieldApprovalThunks';
import { type YieldFlowDisplayToken, type YieldFlowType } from './stablecoinYieldTypes';
import {
    getWithdrawRequestAmount,
    getYieldApprovalModalParams,
    getYieldSupplyTransaction,
    getYieldWithdrawTransaction,
} from './stablecoinYieldUtils';

type YieldActionTransaction = TransactionDto & {
    id: string;
};

type PrepareYieldActionParams = {
    flowType: YieldFlowType;
    flowData: YieldFlowResolvedData;
    amount: string;
};

type YieldApprovalModalParams = NonNullable<ReturnType<typeof getYieldApprovalModalParams>>;

type ParsedYieldActionTransaction = NonNullable<
    ReturnType<typeof parseUnsignedEvmTransactionForSigning>
>;

type GetYieldActionReviewTokenParams = {
    token: YieldFlowDisplayToken;
    symbol: NetworkSymbol;
};

type GetYieldActionReviewStateParams = GetYieldActionReviewTokenParams & {
    amount: string;
    flowType: YieldFormMetadata['type'];
    transaction: TransactionDto;
    vaultName: string;
};

export type YieldActionReviewState = {
    formState: FormState;
    parsedTransaction: ParsedYieldActionTransaction;
    precomposedTransaction: PrecomposedTransactionFinal;
};

export type PrepareYieldActionErrorReason =
    | 'request-amount-unavailable'
    | 'submission-failed'
    | 'verification-failed'
    | 'missing-action-transaction';

export type PrepareYieldActionResult =
    | {
          type: 'approval-required';
          requestAmount: string;
          approvalModalParams: YieldApprovalModalParams;
          transactions: TransactionDto[];
      }
    | {
          type: 'action-ready';
          requestAmount: string;
          reviewAmount: string;
          actionTransaction: YieldActionTransaction;
          receiptAmount: string;
      }
    | {
          type: 'error';
          reason: PrepareYieldActionErrorReason;
      };

const getYieldActionTransaction = ({
    flowType,
    transactions,
}: Pick<PrepareYieldActionParams, 'flowType'> & {
    transactions: TransactionDto[];
}) => {
    switch (flowType) {
        case 'supply':
            return getYieldSupplyTransaction(transactions);
        case 'withdraw':
            return getYieldWithdrawTransaction(transactions);
        default:
            return exhaustive(flowType);
    }
};

const getYieldReceiptAmount = ({
    flowType,
    flowData,
    amount,
    requestAmount,
}: PrepareYieldActionParams & {
    requestAmount: string;
}) => {
    switch (flowType) {
        case 'supply':
            return (
                getWithdrawRequestAmount({
                    networkSymbol: flowData.account.symbol,
                    amount,
                    token: flowData.token,
                    receiptToken: flowData.receiptToken,
                    pricePerShare: flowData.vault.state?.pricePerShareState?.price,
                }) ?? amount
            );
        case 'withdraw':
            return requestAmount;
        default:
            return exhaustive(flowType);
    }
};

const toGweiAmount = (amount: bigint) => fromWei(amount.toString(), 'gwei');

const getYieldActionReviewToken = ({
    token,
    symbol,
}: GetYieldActionReviewTokenParams): TokenInfo | undefined => {
    if (!token.contractAddress) {
        return undefined;
    }

    return {
        standard: 'ERC20',
        contract: getContractAddressForNetworkSymbol(symbol, token.contractAddress),
        symbol: token.symbol,
        decimals: token.decimals,
        name: token.symbol,
    };
};

export const getYieldActionReviewState = ({
    amount,
    flowType,
    token,
    symbol,
    transaction,
    vaultName,
}: GetYieldActionReviewStateParams): YieldActionReviewState | null => {
    const parsedTransaction = parseUnsignedEvmTransactionForSigning(
        transaction.unsignedTransaction,
    );

    if (!parsedTransaction) {
        return null;
    }

    const gasPrice = parsedTransaction.maxFeePerGas ?? parsedTransaction.gasPrice;

    if (!gasPrice) {
        return null;
    }

    const gasLimit = BigInt(parsedTransaction.gasLimit);
    const gasPriceWei = BigInt(gasPrice);
    const feeWei = gasLimit * gasPriceWei;
    const reviewToken = getYieldActionReviewToken({ token, symbol });
    const amountSubunits = convertAmountUnitsToSubunits(amount, token.decimals);
    let eip1559ReviewFields: Partial<
        Pick<PrecomposedTransactionFinal, 'maxFeePerGas' | 'maxPriorityFeePerGas'>
    > = {};

    if (parsedTransaction.maxFeePerGas && parsedTransaction.maxPriorityFeePerGas) {
        eip1559ReviewFields = {
            maxFeePerGas: toGweiAmount(BigInt(parsedTransaction.maxFeePerGas)),
            maxPriorityFeePerGas: toGweiAmount(BigInt(parsedTransaction.maxPriorityFeePerGas)),
        };
    }

    const formState: FormState = {
        outputs: [
            {
                type: 'payment',
                address: parsedTransaction.to,
                amount,
                fiat: '',
                currency: { value: '', label: '' },
                token: reviewToken?.contract ?? null,
                dataHex: parsedTransaction.data,
            },
        ],
        selectedFee: 'custom',
        feePerUnit: toGweiAmount(gasPriceWei),
        feeLimit: gasLimit.toString(),
        ...eip1559ReviewFields,
        options: ['broadcast', 'transactionData'],
        transactionData: parsedTransaction.data,
        isCoinControlEnabled: false,
        hasCoinControlBeenOpened: false,
        selectedUtxos: [],
        yieldMetadata: { type: flowType, vaultName },
    };

    const precomposedTransaction: PrecomposedTransactionFinal = {
        type: 'final',
        fee: feeWei.toString(),
        feePerByte: toGweiAmount(gasPriceWei),
        feeLimit: gasLimit.toString(),
        totalSpent: reviewToken ? amountSubunits : (BigInt(amountSubunits) + feeWei).toString(),
        bytes: 0,
        inputs: [],
        outputs: [
            {
                address: parsedTransaction.to,
                amount: amountSubunits,
            },
        ],
        outputsPermutation: [0],
        ...(reviewToken ? { token: reviewToken, isTokenKnown: true } : {}),
        ...eip1559ReviewFields,
    };

    return {
        formState,
        parsedTransaction,
        precomposedTransaction,
    };
};

export const prepareYieldAction = async ({
    flowType,
    flowData,
    amount,
}: PrepareYieldActionParams): Promise<PrepareYieldActionResult> => {
    const requestAmount = getApprovalRequestAmount({
        flowType,
        amount,
        flowData,
    });

    if (!requestAmount) {
        return {
            type: 'error',
            reason: 'request-amount-unavailable',
        };
    }

    try {
        const { response, verification } = await submitYieldOpportunity({
            flowType,
            flowData,
            amount: requestAmount,
        });

        if (verification === 'failure') {
            return {
                type: 'error',
                reason: 'verification-failed',
            };
        }

        const { transactions } = response.data;
        const approvalModalParams = getYieldApprovalModalParams(transactions);

        if (approvalModalParams) {
            return {
                type: 'approval-required',
                requestAmount,
                approvalModalParams,
                transactions,
            };
        }

        const actionTransaction = getYieldActionTransaction({ flowType, transactions });

        if (!actionTransaction?.id) {
            return {
                type: 'error',
                reason: 'missing-action-transaction',
            };
        }

        return {
            type: 'action-ready',
            requestAmount,
            reviewAmount: flowType === 'withdraw' ? requestAmount : amount,
            actionTransaction,
            receiptAmount: getYieldReceiptAmount({
                flowType,
                flowData,
                amount,
                requestAmount,
            }),
        };
    } catch {
        return {
            type: 'error',
            reason: 'submission-failed',
        };
    }
};
