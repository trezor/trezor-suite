import { bech32 } from '@scure/base';

import { type AdaPools } from '@suite-common/earn-staking-api';
import {
    EVERSTAKE_POOLS,
    FIVE_BINARIES_POOLS,
    type NetworkSymbol,
} from '@suite-common/wallet-config';
import {
    CARDANO_EVERSTAKE_DREP,
    CARDANO_EVERSTAKE_STAKING_POOL,
} from '@suite-common/wallet-constants';
import {
    type Account,
    type StakeType,
    type SupportedCardanoNetworkSymbols,
    type WalletAccountTransaction,
    supportedCardanoNetworkSymbols,
} from '@suite-common/wallet-types';
import { PROTO } from '@trezor/connect';
import { BigNumber, isArrayMember } from '@trezor/utils';

import { CARDANO_ALWAYS_ABSTAIN_DREP_ID } from './cardanoStakingConstants';
import { type VotingDelegationOption } from './cardanoStakingTypes';

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
// https://cips.cardano.org/cip/CIP-0129: DRep key type 0010 joined with credential type 0010 / 0011
const DREP_CIP129_KEY_HASH_HEADER = 0x22;
const DREP_CIP129_SCRIPT_HASH_HEADER = 0x23;

export type CardanoDrepCredential = {
    type: PROTO.CardanoDRepType.KEY_HASH | PROTO.CardanoDRepType.SCRIPT_HASH;
    hex: string;
};

const decodeDrepCip129Payload = (bytes: Uint8Array): CardanoDrepCredential | null => {
    const hex = Buffer.from(bytes.subarray(1)).toString('hex');

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

export const validateCardanoDrep = (drepId: string) => decodeCardanoDrepId(drepId) !== null;

const encodeCardanoDrepIdCip129 = ({ type, hex }: CardanoDrepCredential) => {
    const header =
        type === PROTO.CardanoDRepType.KEY_HASH
            ? DREP_CIP129_KEY_HASH_HEADER
            : DREP_CIP129_SCRIPT_HASH_HEADER;

    return bech32.encode(
        'drep',
        bech32.toWords(Uint8Array.from([header, ...Buffer.from(hex, 'hex')])),
    );
};

export const normalizeCardanoDrepId = (drepId: string) => {
    const credential = decodeCardanoDrepId(drepId);

    return credential === null ? null : encodeCardanoDrepIdCip129(credential);
};

export const areCardanoDrepIdsEqual = (drepIdA?: string | null, drepIdB?: string | null) => {
    if (!drepIdA || !drepIdB) return false;
    if (drepIdA === drepIdB) return true;

    const normalizedDrepIdA = normalizeCardanoDrepId(drepIdA);

    return normalizedDrepIdA !== null && normalizedDrepIdA === normalizeCardanoDrepId(drepIdB);
};

export const getCardanoAccountDrepId = (account?: Account) => {
    if (account?.networkType !== 'cardano') return null;

    const drep = account.misc?.staking?.drep;
    if (!drep?.drep_id) return null;

    const credential = decodeCardanoDrepId(drep.drep_id);
    // Predefined ids (`drep_always_abstain`, `drep_always_no_confidence`) are not bech32.
    if (credential === null) return drep.drep_id;

    // A legacy `drep1…` id spells key and script hashes alike; the backend flag tells them apart.
    return encodeCardanoDrepIdCip129({
        ...credential,
        type: drep.has_script ? PROTO.CardanoDRepType.SCRIPT_HASH : credential.type,
    });
};

export const hasCardanoLiveVoteDelegation = (account?: Account) =>
    !!isCardanoStakingActive(account ?? null) && !!getCardanoAccountDrepId(account);

export const isCardanoWithdrawalBlockedByMissingDrep = (account?: Account) => {
    if (account?.networkType !== 'cardano') return false;

    const rewards = account.misc?.staking?.rewards ?? '0';

    return new BigNumber(rewards).gt(0) && !hasCardanoLiveVoteDelegation(account);
};

export const getCardanoCurrentVotingOption = (
    account?: Account,
): VotingDelegationOption | undefined => {
    const drepId = getCardanoAccountDrepId(account);

    switch (drepId) {
        case null:
            return undefined;
        case CARDANO_ALWAYS_ABSTAIN_DREP_ID:
            return { type: 'abstain' };
        case CARDANO_EVERSTAKE_DREP.bech32:
            return { type: 'everstake' };
        default:
            return { type: 'another_drep', drepId };
    }
};

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
