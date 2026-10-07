import type { PrivatePendingParams, TokenInfo } from '@trezor/blockchain-link-types';
import type { ERRORS } from '@trezor/connect-common';
import type {
    ChainSendAccount,
    ChainSendDraft,
    RbfTransactionParams,
} from '@trezor/network-module-suite-common-types';

export type EvmSendConfig = {
    decimals: number;

    /** The coin symbol shown to the user, for error messages. */
    displaySymbol: string;

    /** Coin kept back for fees when the user enables the reserve, in units. */
    nativeTokenReserve?: string;
    chainId?: number;
};

export type EvmFeeEstimationFailure = {
    account: ChainSendAccount;
    draft: ChainSendDraft;
    tokenInfo: TokenInfo | undefined;

    /** The address the gas was estimated against. */
    estimateTarget: string;
    error: { message: string; code: ERRORS.ErrorCode };
};

export type ResolveEvmNonceParams = {
    account: ChainSendAccount;

    /** A replaced transaction keeps its nonce. */
    rbfParams?: RbfTransactionParams;

    /** Ask the backend for the mined-only nonce, which costs a call but is authoritative. */
    fetchConfirmedNonce: boolean;
};

export type ResolvedEvmNonce = {
    /** The nonce to sign the next transaction with. */
    nonce: string;

    /** The lowest nonce a transaction can still use. */
    confirmedNonce: string;
};

/** What EVM sending needs from the app, beyond Connect. */
export type EvmSendAppDeps = {
    /** Whether the selected device shows ERC-20 approvals itself, naming the token. */
    isApprovalFlowSupported: () => boolean;

    /**
     * The wallet's own pending sends the backend may not see yet, so it estimates gas against the
     * right pending state (trezor/blockbook#1639). `undefined` when nothing is pending.
     */
    getEvmPrivatePendingHint: (account: ChainSendAccount) => PrivatePendingParams | undefined;

    /** The nonce for the next transaction, from the backend and the transactions the wallet knows. */
    resolveEvmNonce: (params: ResolveEvmNonceParams) => Promise<ResolvedEvmNonce>;

    /** Reports a failed gas estimate; composing then falls back to a backup gas limit. */
    onEvmFeeEstimationFailed: (failure: EvmFeeEstimationFailure) => void;
};
