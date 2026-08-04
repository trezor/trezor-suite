import { bech32 } from '@scure/base';

import { type AdaPools } from '@suite-common/earn-staking-api';
import {
    EVERSTAKE_POOLS,
    FIVE_BINARIES_POOLS,
    type NetworkSymbol,
    getNetworkFeatures,
} from '@suite-common/wallet-config';
import {
    type Account,
    type StakeType,
    type SupportedCardanoNetworkSymbols,
    type WalletAccountTransaction,
    supportedCardanoNetworkSymbols,
} from '@suite-common/wallet-types';
import { PROTO } from '@trezor/connect';
import { isArrayMember } from '@trezor/utils';

import { CARDANO_EVERSTAKE_STAKING_POOL } from './cardanoStakingConstants';

export function isSupportedAdaStakingNetworkSymbol(
    symbol: NetworkSymbol,
): symbol is SupportedCardanoNetworkSymbols {
    return isArrayMember(symbol, supportedCardanoNetworkSymbols);
}

export const getCardanoStakingSymbols = (networkSymbols: NetworkSymbol[]) =>
    networkSymbols.reduce((acc, networkSymbol) => {
        if (
            isSupportedAdaStakingNetworkSymbol(networkSymbol) &&
            getNetworkFeatures(networkSymbol).includes('staking')
        ) {
            acc.push(networkSymbol);
        }

        return acc;
    }, [] as SupportedCardanoNetworkSymbols[]);

export const isCardanoStakingActive = (account: Account | null) => {
    if (!account?.misc || account.networkType !== 'cardano') return false;

    const { isActive } = account.misc.staking;

    return isActive;
};

export const getCardanoAccountPoolId = (account?: Account) => {
    if (account?.networkType !== 'cardano') return null;

    const poolId = account.misc?.staking?.poolId;

    return poolId || null;
};

export const getCardanoAccountDrepId = (account?: Account) => {
    if (account?.networkType !== 'cardano') return null;

    const drepId = account.misc?.staking?.drep?.drep_id;

    return drepId || null;
};

export const hasCardanoLiveVoteDelegation = (account?: Account) =>
    !!isCardanoStakingActive(account ?? null) && !!getCardanoAccountDrepId(account);

export const isCardanoStakedWithEverstake = (
    account: Account,
    cardanoStakingPools?: AdaPools['pools'],
) => {
    const accountPoolId = getCardanoAccountPoolId(account);
    if (!accountPoolId) return false;

    // EVERSTAKE_POOLS is the definitive list — migration should only be offered to users
    // outside the Everstake ecosystem entirely, not between Everstake pools.
    if (EVERSTAKE_POOLS.includes(accountPoolId)) return true;

    return cardanoStakingPools?.some(pool => pool.id === accountPoolId) ?? false;
};

export const isCardanoStakedOutsideEverstake = (
    account: Account,
    cardanoStakingPools: AdaPools['pools'],
) => {
    if (!getCardanoAccountPoolId(account)) return false;

    return !isCardanoStakedWithEverstake(account, cardanoStakingPools);
};

export const isCardanoStakedWithFiveBinaries = (account: Account) => {
    const accountPoolId = getCardanoAccountPoolId(account);
    if (!accountPoolId) return false;

    return FIVE_BINARIES_POOLS.includes(accountPoolId);
};

export const poolBech32ToHex = (poolId: string): string => {
    const decoded = bech32.decode(poolId as `${string}1${string}`);
    const bytes = bech32.fromWords(decoded.words);

    return Buffer.from(bytes).toString('hex');
};

// poolBech32ToHex throws (bech32.decode) on a malformed pool id, and selectBestCardanoPool runs
// inside a render-time selector (selectPoolStatsApy) as well as during tx composition — a throw
// would crash the render. This returns null instead so callers can fall back to the Everstake pool.
const tryPoolBech32ToHex = (poolId: string): string | null => {
    try {
        return poolBech32ToHex(poolId);
    } catch {
        return null;
    }
};

export const selectBestCardanoPool = (pools?: AdaPools['pools'], currentPoolId?: string | null) => {
    // An account already delegated to an Everstake pool must never be moved to another
    // pool, no matter which UI flow composes the delegation.
    if (
        currentPoolId &&
        (EVERSTAKE_POOLS.includes(currentPoolId) || pools?.some(pool => pool.id === currentPoolId))
    ) {
        const hex = tryPoolBech32ToHex(currentPoolId);
        if (hex === null) return CARDANO_EVERSTAKE_STAKING_POOL;

        return {
            hex,
            bech32: currentPoolId,
        };
    }

    if (!pools || pools.length === 0) return CARDANO_EVERSTAKE_STAKING_POOL;

    // Sort client-side instead of relying on the API ordering contract; new stakes
    // always go to the least saturated pool.
    const [bestPool] = pools.toSorted((a, b) => a.saturation - b.saturation);

    if (!bestPool) return CARDANO_EVERSTAKE_STAKING_POOL;

    const hex = tryPoolBech32ToHex(bestPool.id);
    if (hex === null) return CARDANO_EVERSTAKE_STAKING_POOL;

    return {
        hex,
        bech32: bestPool.id,
    };
};

// https://cips.cardano.org/cip/CIP-0129 governance key header bytes for DRep ids.
const CIP129_DREP_KEY_HASH_HEADER = 0x22;
const CIP129_DREP_SCRIPT_HASH_HEADER = 0x23;

export const validateCardanoDrep = (drepId: string): boolean => {
    try {
        const { prefix, words } = bech32.decode(drepId as `${string}1${string}`);
        if (prefix !== 'drep' && prefix !== 'drep_script') return false;

        const bytes = bech32.fromWords(words);
        if (bytes.length !== 28 && bytes.length !== 29) return false;

        if (prefix === 'drep_script' && bytes.length !== 28) return false;

        // CIP-129 (29-byte) ids carry a header byte that must map to a supported
        // DRep type; otherwise parseDrepCip129 would throw. Keep validation aligned
        // with parsing so a bech32-valid but unsupported-header id is rejected here
        // instead of throwing later during transaction composition.
        if (
            bytes.length === 29 &&
            bytes[0] !== CIP129_DREP_KEY_HASH_HEADER &&
            bytes[0] !== CIP129_DREP_SCRIPT_HASH_HEADER
        ) {
            return false;
        }

        return true;
    } catch {
        return false;
    }
};

// https://cips.cardano.org/cip/CIP-0129
const parseDrepCip129 = (bytes: number[]) => {
    const header = bytes[0];
    const hex = Buffer.from(bytes.slice(1)).toString('hex');

    switch (header) {
        case CIP129_DREP_KEY_HASH_HEADER:
            return { type: PROTO.CardanoDRepType.KEY_HASH, hex };
        case CIP129_DREP_SCRIPT_HASH_HEADER:
            return { type: PROTO.CardanoDRepType.SCRIPT_HASH, hex };
        default:
            throw new Error(`Unsupported DRep id CIP-129 header: ${header}`);
    }
};

// https://cips.cardano.org/cip/CIP-0105#drep-keys-1
// Legacy
const parseDrepCip105 = (bytes: number[], prefix: string) => {
    const hex = Buffer.from(bytes).toString('hex');

    switch (prefix) {
        case 'drep':
            return { type: PROTO.CardanoDRepType.KEY_HASH, hex };
        case 'drep_script':
            return { type: PROTO.CardanoDRepType.SCRIPT_HASH, hex };
        default:
            throw new Error(`Unsupported DRep id CIP-105 prefix: ${prefix}`);
    }
};

export const parseDrepBech32 = (drepId: string): { type: PROTO.CardanoDRepType; hex: string } => {
    if (!validateCardanoDrep(drepId)) throw new Error('Not a DRep bech32');

    const { words, prefix } = bech32.decode(drepId as `${string}1${string}`);
    const bytes = Array.from(bech32.fromWords(words));

    if (bytes.length === 28) {
        return parseDrepCip105(bytes, prefix);
    }

    if (bytes.length === 29) {
        return parseDrepCip129(bytes);
    }

    throw new Error(`Unsupported DRep payload length: ${bytes.length}`);
};

type CardanoSpecific = NonNullable<WalletAccountTransaction['cardanoSpecific']>;
export const subtypeToStakeTypeMap: Record<Required<CardanoSpecific>['subtype'], StakeType> = {
    stake_delegation: 'stake',
    stake_registration: 'stake',
    stake_deregistration: 'unstake',
    withdrawal: 'claim',
    governance_delegation: 'change-delegate',
};

export const isCardanoStakingTx = (transaction: WalletAccountTransaction) =>
    transaction.cardanoSpecific?.subtype && !transaction.tokens.length;
