import type { NonceOverride } from './NonceOverride';
import type { Recipients } from './Recipients';
import type { TransactionData } from './TransactionData';
import type { TransactionMemo } from './TransactionMemo';

/**
 * What a send can do on a network beyond moving an amount to an address. Each member is a small
 * contract of its own, present exactly when the network offers it, so a part of the send form
 * depends only on the one it renders. Members that are `true` carry no rules yet.
 *
 * @serviceContract
 */
export type SendOptions = {
    readonly memo?: TransactionMemo;
    readonly data?: TransactionData;
    readonly nonce?: NonceOverride;
    readonly recipients?: Recipients;
    /** A UTXO transaction that can't be mined before a block height or a time. */
    readonly locktime?: true;
    /** Picking which coins (UTXOs) the transaction spends. */
    readonly coinSelection?: true;
    /** An output that carries data and no amount, such as OP_RETURN. */
    readonly dataOutput?: true;
    /** Signing without broadcasting, to broadcast the transaction elsewhere. */
    readonly deferredBroadcast?: true;
};
