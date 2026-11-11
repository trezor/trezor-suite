import {
    type OpenTransaction,
    type TransactionDetails,
    type TransactionFact,
    type TransactionFactValue,
    defineTransactionDetails,
} from '@trezor/network-module-suite-common-types';
import { BigNumber } from '@trezor/utils';

import { ethereumTransactionLabels as labels } from './ethereumTransactionLabels';

/** What any EVM backend reports: the receipt's gas and the price actually charged per unit. */
type EvmGasTransaction = {
    readonly nonce: number;
    readonly gasLimit: number;
    readonly gasUsed?: number;
    /** The effective price on L2s, otherwise the gas price bid. */
    readonly chargedGasPrice: string;
};

/** EIP-1559 fee market fields, which only an indexer such as Blockbook reports. */
type EvmFeeMarket = {
    readonly maxFeePerGas: string;
    readonly maxPriorityFeePerGas?: string;
    readonly baseFeePerGas?: string;
};

type BlockbookEvmTransaction = EvmGasTransaction & { readonly feeMarket?: EvmFeeMarket };

const toGwei = (wei: string): TransactionFactValue => ({
    kind: 'feeRate',
    rate: new BigNumber(wei).shiftedBy(-9).toFixed(),
    unit: 'Gwei',
});

const toGasTransaction = (transaction: OpenTransaction): EvmGasTransaction | undefined => {
    const specific = transaction.ethereumSpecific;

    if (specific === undefined) {
        return undefined;
    }

    const { effectiveGasPrice, gasPrice } = specific;

    return {
        nonce: specific.nonce,
        gasLimit: specific.gasLimit,
        gasUsed: specific.gasUsed,
        chargedGasPrice:
            effectiveGasPrice && new BigNumber(effectiveGasPrice).gt(0)
                ? effectiveGasPrice
                : (gasPrice ?? '0'),
    };
};

const getGasFacts = (
    transaction: EvmGasTransaction,
    isGasPriceKnown: boolean,
): TransactionFact[] => [
    {
        id: 'nonce',
        label: labels.nonce,
        icon: 'sequence',
        value: { kind: 'count', value: transaction.nonce },
    },
    {
        id: 'gas',
        label: transaction.gasUsed ? labels.gasLimitAndUsage : labels.gasLimit,
        icon: 'gas',
        value: {
            kind: 'usage',
            limit: transaction.gasLimit,
            used: transaction.gasUsed || undefined,
        },
    },
    {
        id: 'gasPrice',
        label: labels.gasPrice,
        icon: 'gas',
        value: isGasPriceKnown
            ? toGwei(transaction.chargedGasPrice)
            : { kind: 'pendingUntilConfirmed' },
    },
];

/**
 * A custom RPC node answers with the transaction and its receipt only: gas and the price charged,
 * nothing about the fee market it was priced in.
 */
export const evmRpcTransactionDetails: TransactionDetails =
    defineTransactionDetails<EvmGasTransaction>({
        toTransaction: toGasTransaction,
        getFacts: ({ transaction }) => getGasFacts(transaction, true),
    });

/** Blockbook adds the EIP-1559 fee market, so its transactions explain how the price was set. */
export const blockbookEvmTransactionDetails: TransactionDetails =
    defineTransactionDetails<BlockbookEvmTransaction>({
        toTransaction: transaction => {
            const gas = toGasTransaction(transaction);
            const specific = transaction.ethereumSpecific;

            if (gas === undefined) {
                return undefined;
            }

            return specific?.maxFeePerGas
                ? {
                      ...gas,
                      feeMarket: {
                          maxFeePerGas: specific.maxFeePerGas,
                          maxPriorityFeePerGas: specific.maxPriorityFeePerGas,
                          baseFeePerGas: specific.baseFeePerGas,
                      },
                  }
                : gas;
        },
        getFacts: ({ transaction, isConfirmed }) => {
            const { feeMarket } = transaction;
            // A pending EIP-1559 transaction has only bid, the price it pays is set by its block.
            const gasFacts = getGasFacts(transaction, isConfirmed || feeMarket === undefined);

            if (feeMarket === undefined) {
                return gasFacts;
            }

            return [
                ...gasFacts,
                {
                    id: 'maxFeePerGas',
                    label: labels.maxFeePerGas,
                    icon: 'gas',
                    value: toGwei(feeMarket.maxFeePerGas),
                },
                {
                    id: 'baseFeePerGas',
                    label: labels.baseFeePerGas,
                    icon: 'gas',
                    value: isConfirmed
                        ? toGwei(feeMarket.baseFeePerGas || '0')
                        : { kind: 'pendingUntilConfirmed' },
                },
                {
                    id: 'maxPriorityFeePerGas',
                    label: labels.maxPriorityFeePerGas,
                    icon: 'gas',
                    value: toGwei(feeMarket.maxPriorityFeePerGas ?? '0'),
                },
            ];
        },
    });
