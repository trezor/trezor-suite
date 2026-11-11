import { type ComponentType, type ReactNode } from 'react';

import { type PendingEvmNonceStatus } from '@suite-common/wallet-utils';
import type { TransactionFact } from '@trezor/network-module-suite-common-types';

/** What the app knows about a transaction beyond the network's own facts. */
export type TransactionFactsContext = {
    // Whether this tx's own nonce is stuck (gapped or already superseded) — see useEvmNonceInfo.
    nonceStatus?: PendingEvmNonceStatus;
    nextNonce?: number;
};

export type DefaultTransactionFactsProps = {
    facts: readonly TransactionFact[];
    /** Appends something to a fact's value without replacing how the value itself is shown. */
    decorate?: (fact: TransactionFact) => ReactNode;
};

/**
 * What a family's own transaction facts UI receives: the same facts, the app's context and the
 * default list, so it can extend the list instead of rebuilding it.
 */
export type TransactionFactsOverrideProps = {
    facts: readonly TransactionFact[];
    context: TransactionFactsContext;
    DefaultFacts: ComponentType<DefaultTransactionFactsProps>;
};

export type TransactionFactsOverrides = Readonly<
    Partial<Record<string, ComponentType<TransactionFactsOverrideProps>>>
>;
