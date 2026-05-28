import { type ChainedTransactions } from '@suite-common/wallet-types';
import { calculateChainedTransactionsFeeForRbf } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

/**
 * Default minimum relay fee in sat/vB used for BIP-125 RBF replacement transactions.
 * Bitcoin Core has officially lowered both the min relay tx fee and the incremental relay fee defaults,
 * but actual minimums depend on each node's configuration, so we keep a conservative floor.
 */
const DEFAULT_RELAY_FEE_PER_VB = 0.2;

type CancelTransactionProps = {
    newTransactionSize: number;
    chainedTxs?: ChainedTransactions;
    originalFee: string;
    relayFee?: number;
};

export const calculateNewFee = ({
    newTransactionSize,
    chainedTxs,
    originalFee,
    relayFee = DEFAULT_RELAY_FEE_PER_VB,
}: CancelTransactionProps) => {
    /**
     * Rules:
     °   3. The replacement transaction pays an absolute fee of at least the sum paid by the original transactions.
     *   4. The replacement transaction must also pay for its own bandwidth at or above the rate set by the node's minimum relay fee setting.
     *
     * @see https://github.com/bitcoin/bips/blob/master/bip-0125.mediawiki#implementation-details
     */
    const newFeeRate = new BigNumber(originalFee) // BIP-125 rule 3 (paying for original transaction)
        .plus(newTransactionSize * relayFee) // BIP-125 rule 4 (paying the relay fee)
        .div(newTransactionSize);

    const chainedTransactionFees =
        chainedTxs && calculateChainedTransactionsFeeForRbf({ chainedTxs });

    return { newFeeRate, chainedTransactionFees };
};
