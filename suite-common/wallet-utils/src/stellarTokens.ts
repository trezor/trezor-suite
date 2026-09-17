import type { Account, StellarTokenInfo } from '@suite-common/wallet-types';
import type { TokenDetailByMint } from '@trezor/blockchain-link-types';
import { getTokenMetadata } from '@trezor/blockchain-link-utils/src/stellar';
import {
    STELLAR_DECIMALS,
    fitStellarMemoText,
    isStellarClassicAssetKey,
} from '@trezor/network-stellar/constants';
import stellar from '@trezor/network-stellar/runtime';
import { createLazy, scheduleAction } from '@trezor/utils';

export const lazyStellarTokenMetadata = createLazy(getTokenMetadata);

/** Resolves a pasted Stellar Asset Contract id to the classic asset the definitions list. */
export const resolveStellarContractId = async (contractId: string) => {
    const { resolveClassicAssetFromContractId } = await stellar();

    return resolveClassicAssetFromContractId(
        contractId,
        await lazyStellarTokenMetadata.getOrInit(),
    );
};

/** The token name as trustline memo; the operation already carries code and issuer. */
export const getStellarTrustlineMemoFromMetadata = (
    contract: string,
    tokenMetadata: TokenDetailByMint,
): string | undefined => fitStellarMemoText(tokenMetadata[contract]?.name ?? '') || undefined;

// The definitions are fetched over the network, and this runs on the way to a device prompt.
const TRUSTLINE_MEMO_TIMEOUT_MS = 3000;

/** Bounded: the memo must not delay the device prompt. */
export const getStellarTrustlineMemo = async (contract: string) => {
    try {
        const tokenMetadata = await scheduleAction(() => lazyStellarTokenMetadata.getOrInit(), {
            timeout: TRUSTLINE_MEMO_TIMEOUT_MS,
        });

        return getStellarTrustlineMemoFromMetadata(contract, tokenMetadata);
    } catch {
        // A trustline signs and settles without a memo.
        return undefined;
    }
};

/** The token as the definitions describe it; absent definitions still give a usable asset code. */
export const buildStellarTokenInfo = (
    contract: string,
    tokenMetadata?: TokenDetailByMint,
): StellarTokenInfo => {
    const metadata = tokenMetadata?.[contract];

    return {
        standard: 'STELLAR-CLASSIC',
        contract,
        name: metadata?.name,
        symbol: contract.split('-')[0],
        decimals: STELLAR_DECIMALS,
        homeDomain: metadata?.home_domain,
        rating: metadata?.rating,
    };
};

/** Best-rated first; a token the definitions do not rate goes last. */
const byDescendingRating = (a: StellarTokenInfo, b: StellarTokenInfo) => {
    if (a.rating == null && b.rating == null) return 0;
    if (a.rating == null) return 1;
    if (b.rating == null) return -1;

    return b.rating - a.rating;
};

/**
 * The tokens the account could still activate, out of `contracts`.
 *
 * Pure: the caller decides where the candidates come from (the published definitions on desktop,
 * the coin definitions already in the store on mobile) and holds the fetched metadata.
 */
export const getStellarInactiveTokens = ({
    contracts,
    activeContracts,
    tokenMetadata,
}: {
    contracts: readonly string[];
    activeContracts: ReadonlySet<string>;
    tokenMetadata?: TokenDetailByMint;
}): StellarTokenInfo[] =>
    contracts
        // A native SEP-41 token has no trustline to activate; it is watched by contract id instead.
        .filter(contract => isStellarClassicAssetKey(contract) && !activeContracts.has(contract))
        .map(contract => buildStellarTokenInfo(contract, tokenMetadata))
        .sort(byDescendingRating);

/** The contracts the account already holds a trustline for. */
export const getStellarActiveTokenContracts = (account?: Pick<Account, 'tokens'>) =>
    new Set(account?.tokens?.map(token => token.contract) ?? []);
