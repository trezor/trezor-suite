import { ChainedTransactions } from '@suite-common/wallet-types';

type CalculateRbfFeeParams = {
    chainedTxs: ChainedTransactions;
};

/**
 * The replacing transaction must pay the sum of the fees of all chained transactions (BIP-125)
 *
 * @see https://github.com/bitcoin/bips/blob/master/bip-0125.mediawiki#implementation-details
 */
export const calculateChainedTransactionsFeeForRbf = ({ chainedTxs }: CalculateRbfFeeParams) =>
    chainedTxs.own.concat(chainedTxs.others).reduce((f, ctx) => f + parseFloat(ctx.fee), 0);
