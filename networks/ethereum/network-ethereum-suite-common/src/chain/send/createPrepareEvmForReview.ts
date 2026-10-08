import { type PrepareForReview, tagReplacement } from '@trezor/network-module-suite-common-types';
import { cloneObject } from '@trezor/utils';

import {
    getEvmTransactionTextSignature,
    isEvmApprovalTxByTextSignature,
    isEvmYieldTxByTextSignature,
} from './evm/evmTransactionPurpose';
import type { EvmSendAppDeps } from './types';

export type PrepareEvmForReviewDeps = Pick<EvmSendAppDeps, 'isEvmTokenDefinitionKnown'>;

export type PrepareEvmForReviewConfig = {
    /** `undefined` where the network's chain is not known to the app. */
    chainId: number | undefined;
};

export type PrepareEvmForReview = (config: PrepareEvmForReviewConfig) => PrepareForReview;

/**
 * An EVM transaction for review: a replacement reuses the nonce, a contract call keeps its own
 * calldata, and a token transfer says whether the device knows the token.
 */
export const createPrepareEvmForReview =
    (deps: PrepareEvmForReviewDeps): PrepareEvmForReview =>
    ({ chainId }) =>
    async ({ draft, precomposed }) => {
        let prepared = tagReplacement(draft, precomposed, { useNativeRbf: false });

        // Contract calldata (e.g. a DEX swap) must not carry `token`: signing would replace the
        // calldata with an ERC-20 transfer. Approvals and yield calls are token calls themselves.
        const purpose = getEvmTransactionTextSignature(draft.transactionData);
        if (
            draft.transactionData &&
            !isEvmApprovalTxByTextSignature(purpose) &&
            !isEvmYieldTxByTextSignature(purpose)
        ) {
            prepared = cloneObject(prepared);
            delete (prepared as { token?: unknown }).token;
        }

        const contract = 'token' in prepared ? prepared.token?.contract : undefined;
        const isTokenKnown =
            contract && chainId
                ? await deps.isEvmTokenDefinitionKnown({ chainId, contract })
                : undefined;

        return { precomposed: prepared, isTokenKnown };
    };
