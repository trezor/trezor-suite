import type { NonceFailureCode, VerifiedNonceRequest } from '@suite/desktop-app-api';

import type { VerifiedAccountState, VerifiedAccountStateValue } from './accountState';
import type { NonceVerifier } from './createNonceVerifier';
import {
    SAFE_PROXY_CODE_HASHES,
    SAFE_SINGLETONS,
    SAFE_SINGLETON_STORAGE_SLOT,
    type SafeProxyVersion,
    type SafeSingleton,
} from './safeDeployments';

// The low 20 bytes of the slot are the address; Safe code never writes the upper 12.
const SINGLETON_SLOT_WORD = /^0x0{24}([0-9a-f]{40})$/;

export type SafeImplementationFailureCode =
    // The account's code is not a canonical Safe proxy, so slot 0 says nothing about what it runs.
    | 'NOT_A_SAFE_PROXY'
    // Slot 0 holds something no Safe proxy factory or `changeMasterCopy` would have written.
    | 'MALFORMED_SINGLETON_SLOT'
    // A Safe, but on a singleton the ERC-7730 registry does not describe (e.g. 1.1.1 or a fork).
    | 'UNSUPPORTED_SINGLETON';

export type SafeImplementation = {
    proxyVersion: SafeProxyVersion;
    singleton: SafeSingleton;
};

export type GetSafeImplementationResult =
    | { success: true; implementation: SafeImplementation }
    | { success: false; code: SafeImplementationFailureCode };

/**
 * Identifies the Safe singleton behind an account from its verified state alone: the code hash
 * must be a canonical Safe proxy, and slot 0 of that proxy must point at a singleton covered by the
 * ERC-7730 registry. Nothing here comes from an unverified RPC answer.
 */
export const getSafeImplementation = (
    state: VerifiedAccountStateValue,
): GetSafeImplementationResult => {
    const proxyVersion = SAFE_PROXY_CODE_HASHES[state.codeHash];
    if (!proxyVersion) return { success: false, code: 'NOT_A_SAFE_PROXY' };

    const slot = state.storage.find(word => word.key === SAFE_SINGLETON_STORAGE_SLOT);
    const singletonAddress = slot ? SINGLETON_SLOT_WORD.exec(slot.value)?.[1] : undefined;
    if (!singletonAddress) return { success: false, code: 'MALFORMED_SINGLETON_SLOT' };

    const singleton = SAFE_SINGLETONS.find(({ address }) => address === `0x${singletonAddress}`);
    if (!singleton) return { success: false, code: 'UNSUPPORTED_SINGLETON' };

    return { success: true, implementation: { proxyVersion, singleton } };
};

export type ResolvedSafeImplementation = {
    status: 'resolved';
    requestId: string;
    // The Safe (proxy) the transaction is sent to.
    address: string;
    // Display-format definitions for calls to the Safe are published under this address.
    definitionsContractAddress: string;
    implementation: SafeImplementation;
    // The verified read the resolution rests on: block, freshness window and evidence.
    accountState: VerifiedAccountState;
};

export type SafeImplementationFailure = {
    status: 'failed';
    requestId: string;
    code: NonceFailureCode | SafeImplementationFailureCode;
    retryable: boolean;
};

export type SafeImplementationResult = ResolvedSafeImplementation | SafeImplementationFailure;

export type SafeImplementationResolverDeps = {
    verifyAccountState: NonceVerifier['verifyAccountState'];
};

export type SafeImplementationResolver = (
    request: VerifiedNonceRequest,
    signal?: AbortSignal,
) => Promise<SafeImplementationResult>;

/**
 * Proves the code hash and slot 0 of the account in one `eth_getProof` against the trusted
 * checkpoint, then maps them to the Safe singleton whose definitions apply.
 */
export const createSafeImplementationResolver =
    (deps: SafeImplementationResolverDeps): SafeImplementationResolver =>
    async (request, signal) => {
        const accountState = await deps.verifyAccountState(
            { ...request, storageKeys: [SAFE_SINGLETON_STORAGE_SLOT] },
            signal,
        );
        if (accountState.status === 'failed') return accountState;

        const resolved = getSafeImplementation(accountState);
        if (!resolved.success) {
            return {
                status: 'failed',
                requestId: accountState.requestId,
                code: resolved.code,
                // The proven state is authoritative; asking again only repeats the answer.
                retryable: false,
            };
        }

        return {
            status: 'resolved',
            requestId: accountState.requestId,
            address: accountState.address,
            definitionsContractAddress: resolved.implementation.singleton.address,
            implementation: resolved.implementation,
            accountState,
        };
    };
