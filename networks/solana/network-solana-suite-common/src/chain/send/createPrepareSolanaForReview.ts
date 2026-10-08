import { type PrepareForReview, tagReplacement } from '@trezor/network-module-suite-common-types';

import type { SolanaSendAppDeps } from './types';

export type PrepareSolanaForReviewDeps = Pick<SolanaSendAppDeps, 'isSolanaTokenDefinitionKnown'>;

export type PrepareSolanaForReview = PrepareForReview;

/** A Solana transaction for review: a token transfer says whether the device knows the token. */
export const createPrepareSolanaForReview =
    (deps: PrepareSolanaForReviewDeps): PrepareSolanaForReview =>
    async ({ draft, precomposed }) => {
        const prepared = tagReplacement(draft, precomposed, { useNativeRbf: false });
        const mint = 'token' in prepared ? prepared.token?.contract : undefined;

        return {
            precomposed: prepared,
            isTokenKnown: mint ? await deps.isSolanaTokenDefinitionKnown(mint) : undefined,
        };
    };
