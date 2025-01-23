import { ChainedTransactions } from '@suite-common/wallet-types';
import { calculateChainedTransactionsFeeForRbf } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

/**
 * The current default value for the minRelayTxFee in Bitcoin Core is 1000 satoshi/kB (= 1 sat/B).
 * A node operator may specify a different value via the startup parameter.
 *
 * @see https://github.com/bitcoin/bitcoin/blob/97153a702600430bdaf6af4f6f4eb8593e32819f/src/validation.h#L63
 * @see https://bitcoin.stackexchange.com/questions/48235/what-is-the-minrelaytxfee
 */
const BIP_125_DEFAULT_RELAY_FEE = 1;

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
    relayFee = BIP_125_DEFAULT_RELAY_FEE,
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
