import {
    type Label,
    type OpenTransaction,
    type TransactionDetails,
    type TransactionFact,
    defineTransactionDetails,
} from '@trezor/network-module-suite-common-types';
import { BigNumber } from '@trezor/utils';

/** Translation ids shared with the desktop catalog, so these are translated wherever it is. */
export const bitcoinTransactionLabels = {
    feeRate: { id: 'TR_FEE_RATE', defaultMessage: 'Fee rate' },
} as const satisfies Record<string, Label>;

type BitcoinFeeTransaction = {
    readonly fee: string;
    readonly size: number;
};

type BlockbookBitcoinTransaction = BitcoinFeeTransaction & {
    /** Reported by Blockbook; transactions stored before it did so lack it. */
    readonly feeRate?: string;
};

const toFeeTransaction = ({ fee, details }: OpenTransaction): BitcoinFeeTransaction | undefined =>
    details.size > 0 ? { fee, size: details.size } : undefined;

const toFeeRateFact = (rate: BigNumber): TransactionFact => ({
    id: 'feeRate',
    label: bitcoinTransactionLabels.feeRate,
    icon: 'fee',
    value: { kind: 'feeRate', rate: rate.toFixed(2), unit: 'sat/vB' },
});

const computeFeeRate = ({ fee, size }: BitcoinFeeTransaction) =>
    new BigNumber(fee).div(size).integerValue(BigNumber.ROUND_CEIL);

/** Electrum servers report no fee rate, so it is computed from the fee and the size. */
export const electrumBitcoinTransactionDetails: TransactionDetails =
    defineTransactionDetails<BitcoinFeeTransaction>({
        toTransaction: toFeeTransaction,
        getFacts: ({ transaction }) => [toFeeRateFact(computeFeeRate(transaction))],
    });

export const blockbookBitcoinTransactionDetails: TransactionDetails =
    defineTransactionDetails<BlockbookBitcoinTransaction>({
        toTransaction: transaction => {
            const feeTransaction = toFeeTransaction(transaction);

            return feeTransaction && { ...feeTransaction, feeRate: transaction.feeRate };
        },
        getFacts: ({ transaction }) => [
            toFeeRateFact(
                transaction.feeRate
                    ? new BigNumber(transaction.feeRate)
                    : computeFeeRate(transaction),
            ),
        ],
    });
