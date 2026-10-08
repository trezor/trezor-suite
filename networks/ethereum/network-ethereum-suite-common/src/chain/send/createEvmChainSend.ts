import type {
    ChainNetworkSendDefinition,
    PrecomposedLevels,
    PushChainTransactionParams,
    PushedChainTransaction,
} from '@trezor/network-module-suite-common-types';

import {
    type ComposeEvmFeeLevelsDeps,
    createComposeEvmFeeLevels,
} from './createComposeEvmFeeLevels';
import { createEvmPendingTransaction } from './createEvmPendingTransaction';
import {
    type PrepareEvmForReviewDeps,
    createPrepareEvmForReview,
} from './createPrepareEvmForReview';
import { type SignEvmTransactionDeps, createSignEvmTransaction } from './createSignEvmTransaction';
import type { EvmSendConfig } from './types';

/**
 * What an EVM send needs, whatever the backend: how gas is estimated, how the nonce is read and
 * how a signed transaction is broadcast. The device signs the same way on every EVM chain.
 */
export type EvmChainSendDeps = ComposeEvmFeeLevelsDeps &
    PrepareEvmForReviewDeps &
    SignEvmTransactionDeps & {
        push: (params: PushChainTransactionParams) => Promise<PushedChainTransaction>;
    };

/** The send of one EVM chain, by its configuration. */
export type EvmChainSend = (config: EvmSendConfig) => ChainNetworkSendDefinition<PrecomposedLevels>;

export const createEvmChainSend = (deps: EvmChainSendDeps): EvmChainSend => {
    const composeFeeLevels = createComposeEvmFeeLevels(deps);
    const prepareForReview = createPrepareEvmForReview(deps);
    const sign = createSignEvmTransaction(deps);

    return config => ({
        composeFeeLevels: params => composeFeeLevels({ ...params, config }),
        prepareForReview: prepareForReview({ chainId: config.chainId }),
        sign: params => sign({ ...params, config }),
        push: deps.push,
        createPendingTransaction: createEvmPendingTransaction,
    });
};
