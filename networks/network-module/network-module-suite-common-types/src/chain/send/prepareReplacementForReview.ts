import { BigNumber } from '@trezor/utils';

import type { ChainSendDraft, PrepareForReview } from './ChainSend';
import {
    type GeneralPrecomposedTransactionFinal,
    type PrecomposedTransactionFinalBumpFeeRbf,
    type PrecomposedTransactionFinalCancelRbf,
    isRbfCancelTransaction,
} from './PrecomposedTransaction';

export type TagReplacementOptions = {
    /** The network replaces in place (BIP-125) rather than by reusing the nonce. */
    useNativeRbf: boolean;
};

/**
 * A replacement (RBF) carries which transaction it replaces and what it costs on top. A cancel is
 * already tagged by its own compose and keeps its tag; anything else replacing is a fee bump.
 */
export const tagReplacement = (
    draft: ChainSendDraft,
    precomposed: GeneralPrecomposedTransactionFinal,
    { useNativeRbf }: TagReplacementOptions,
): GeneralPrecomposedTransactionFinal => {
    // Transactions built from an unsigned body (Cardano) are never replaced.
    if (!draft.rbfParams || 'unsignedTx' in precomposed) return precomposed;

    if (isRbfCancelTransaction(precomposed)) {
        const cancel: PrecomposedTransactionFinalCancelRbf = {
            ...precomposed,
            rbfType: 'cancel',
            prevTxid: draft.rbfParams.txid,
        };

        return cancel;
    }

    const bumpFee: PrecomposedTransactionFinalBumpFeeRbf = {
        ...precomposed,
        rbfType: 'bump-fee',
        prevTxid: draft.rbfParams.txid,
        feeDifference: new BigNumber(precomposed.fee)
            .minus(draft.rbfParams.type === 'bitcoin' ? draft.rbfParams.baseFee : 0)
            .toFixed(),
        useNativeRbf,
    };

    return bumpFee;
};

/** Review preparation of a network whose only concern is tagging a replacement. */
export const createPrepareReplacementForReview =
    (options: TagReplacementOptions): PrepareForReview =>
    ({ draft, precomposed }) =>
        Promise.resolve({ precomposed: tagReplacement(draft, precomposed, options) });
