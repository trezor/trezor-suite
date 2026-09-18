import { bech32 } from '@scure/base';

import { type AdaPools } from '@suite-common/earn-staking-api';
import {
    EVERSTAKE_POOLS,
    FIVE_BINARIES_POOLS,
    type NetworkSymbol,
} from '@suite-common/wallet-config';
import {
    type Account,
    type StakeType,
    type SupportedCardanoNetworkSymbols,
    type WalletAccountTransaction,
    supportedCardanoNetworkSymbols,
} from '@suite-common/wallet-types';
import { PROTO } from '@trezor/connect';
import { exhaustive } from '@trezor/type-utils';
import { isArrayMember } from '@trezor/utils';

import { CARDANO_EVERSTAKE_STAKING_POOL } from './cardanoStakingConstants';

export function isSupportedAdaStakingNetworkSymbol(
    symbol: NetworkSymbol,
): symbol is SupportedCardanoNetworkSymbols {
    return isArrayMember(symbol, supportedCardanoNetworkSymbols);
}

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

const DREP_HASH_LENGTH = 28;
const DREP_CIP129_PAYLOAD_LENGTH = DREP_HASH_LENGTH + 1;

// https://cips.cardano.org/cip/CIP-0129
const DREP_CIP129_KEY_HASH_HEADER = 0x22;
const DREP_CIP129_SCRIPT_HASH_HEADER = 0x23;

export type CardanoDrepCredential = {
    type: PROTO.CardanoDRepType.KEY_HASH | PROTO.CardanoDRepType.SCRIPT_HASH;
    hex: string;
};

// https://cips.cardano.org/cip/CIP-0129
const decodeDrepCip129Payload = (bytes: Uint8Array): CardanoDrepCredential | null => {
    if (bytes.length !== DREP_CIP129_PAYLOAD_LENGTH) return null;

    const hex = Buffer.from(bytes.slice(1)).toString('hex');

    switch (bytes[0]) {
        case DREP_CIP129_KEY_HASH_HEADER:
            return { type: PROTO.CardanoDRepType.KEY_HASH, hex };
        case DREP_CIP129_SCRIPT_HASH_HEADER:
            return { type: PROTO.CardanoDRepType.SCRIPT_HASH, hex };
        default:
            return null;
    }
};

// https://cips.cardano.org/cip/CIP-0105#drep-keys-1
const decodeDrepCip105Payload = (
    bytes: Uint8Array,
    prefix: string,
): CardanoDrepCredential | null => {
    if (bytes.length !== DREP_HASH_LENGTH) return null;

    const hex = Buffer.from(bytes).toString('hex');

    switch (prefix) {
        case 'drep':
        case 'drep_vkh':
            return { type: PROTO.CardanoDRepType.KEY_HASH, hex };
        case 'drep_script':
            return { type: PROTO.CardanoDRepType.SCRIPT_HASH, hex };
        default:
            return null;
    }
};

export const decodeCardanoDrepId = (drepId: string): CardanoDrepCredential | null => {
    try {
        const { prefix, bytes } = bech32.decodeToBytes(drepId);

        return prefix === 'drep' && bytes.length === DREP_CIP129_PAYLOAD_LENGTH
            ? decodeDrepCip129Payload(bytes)
            : decodeDrepCip105Payload(bytes, prefix);
    } catch {
        return null;
    }
};

export const validateCardanoDrep = (drepId: string): boolean =>
    decodeCardanoDrepId(drepId) !== null;

const getDrepCip129Header = (type: CardanoDrepCredential['type']): number => {
    switch (type) {
        case PROTO.CardanoDRepType.KEY_HASH:
            return DREP_CIP129_KEY_HASH_HEADER;
        case PROTO.CardanoDRepType.SCRIPT_HASH:
            return DREP_CIP129_SCRIPT_HASH_HEADER;
        default:
            return exhaustive(type);
    }
};

const encodeCardanoDrepIdCip129 = (credential: CardanoDrepCredential): string => {
    const payload = Uint8Array.from([
        getDrepCip129Header(credential.type),
        ...Buffer.from(credential.hex, 'hex'),
    ]);

    return bech32.encode('drep', bech32.toWords(payload));
};

export const normalizeCardanoDrepId = (drepId: string): string | null => {
    const credential = decodeCardanoDrepId(drepId);

    return credential === null ? null : encodeCardanoDrepIdCip129(credential);
};

export const areCardanoDrepIdsEqual = (
    drepIdA?: string | null,
    drepIdB?: string | null,
): boolean => {
    if (!drepIdA || !drepIdB) return false;

    if (drepIdA === drepIdB) return true;

    const normalizedDrepIdA = normalizeCardanoDrepId(drepIdA);

    return normalizedDrepIdA !== null && normalizedDrepIdA === normalizeCardanoDrepId(drepIdB);
};

const normalizeAccountDrepId = (drep: { drep_id: string; hex?: string }): string => {
    const credentialFromHex = decodeDrepCip129Payload(
        Uint8Array.from(Buffer.from(drep.hex ?? '', 'hex')),
    );

    if (credentialFromHex !== null) return encodeCardanoDrepIdCip129(credentialFromHex);

    return normalizeCardanoDrepId(drep.drep_id) ?? drep.drep_id;
};

export const getCardanoAccountDrepId = (account?: Account): string | null => {
    if (account?.networkType !== 'cardano') return null;

    const drep = account.misc?.staking?.drep;

    return drep?.drep_id ? normalizeAccountDrepId(drep) : null;
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

export const selectBestCardanoPool = (pools?: AdaPools['pools'], currentPoolId?: string | null) => {
    // An account already delegated to an Everstake pool must never be moved to another
    // pool, no matter which UI flow composes the delegation.
    if (
        currentPoolId &&
        (EVERSTAKE_POOLS.includes(currentPoolId) || pools?.some(pool => pool.id === currentPoolId))
    ) {
        return {
            hex: poolBech32ToHex(currentPoolId),
            bech32: currentPoolId,
        };
    }

    if (!pools || pools.length === 0) return CARDANO_EVERSTAKE_STAKING_POOL;

    // Sort client-side instead of relying on the API ordering contract; new stakes
    // always go to the least saturated pool.
    const [bestPool] = pools.toSorted((a, b) => a.saturation - b.saturation);

    if (!bestPool) return CARDANO_EVERSTAKE_STAKING_POOL;

    return {
        hex: poolBech32ToHex(bestPool.id),
        bech32: bestPool.id,
    };
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
