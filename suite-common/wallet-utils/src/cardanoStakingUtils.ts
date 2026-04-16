import { bech32 } from '@scure/base';

import { type AdaPools } from '@suite-common/earn-staking-api';
import { type NetworkSymbol, getNetworkFeatures } from '@suite-common/wallet-config';
import {
    CARDANO_EVERSTAKE_STAKING_POOL,
    CARDANO_POOL_SATURATION_SAFE_THRESHOLD,
    EVERSTAKE_POOLS,
    FIVE_BINARIES_POOLS,
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

import { asAmountSubunit } from './AmountTypes';
import { subunitsToUnits } from './amountUtils';

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

export const isCardanoStakedWithEverstake = (
    account: Account,
    cardanoStakingPools?: AdaPools['pools'],
) => {
    const accountPoolId = getCardanoAccountPoolId(account);
    if (!accountPoolId) return false;

    if (!cardanoStakingPools?.length) return EVERSTAKE_POOLS.includes(accountPoolId);

    return cardanoStakingPools.some(pool => pool.id === accountPoolId);
};

export const isCardanoStakedOutsideEverstake = (
    account: Account,
    cardanoStakingPools: AdaPools['pools'],
) => {
    const accountPoolId = getCardanoAccountPoolId(account);
    if (!accountPoolId) return false;

    if (!cardanoStakingPools?.length) return EVERSTAKE_POOLS.includes(accountPoolId) === false;

    return cardanoStakingPools.every(pool => pool.id !== accountPoolId);
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

export const selectBestCardanoPool = (pools?: AdaPools['pools']) => {
    if (!pools || pools.length === 0) return CARDANO_EVERSTAKE_STAKING_POOL;

    // find the one within the threshold
    const bestPool = pools.find(pool => pool.saturation < CARDANO_POOL_SATURATION_SAFE_THRESHOLD);

    if (bestPool) {
        return {
            hex: poolBech32ToHex(bestPool.id),
            bech32: bestPool.id,
        };
    }

    // pick the last one (lowest saturation)
    const fallback = pools[pools.length - 1];

    if (!fallback) {
        return CARDANO_EVERSTAKE_STAKING_POOL;
    }

    return {
        hex: poolBech32ToHex(fallback.id),
        bech32: fallback.id,
    };
};

export const validateCardanoDrep = (drepId: string): boolean => {
    try {
        const { prefix, words } = bech32.decode(drepId as `${string}1${string}`);
        if (prefix !== 'drep' && prefix !== 'drep_script') return false;

        const bytes = bech32.fromWords(words);
        if (bytes.length !== 28 && bytes.length !== 29) return false;

        if (prefix === 'drep_script' && bytes.length !== 28) return false;

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
        case 0x22:
            return { type: PROTO.CardanoDRepType.KEY_HASH, hex };
        case 0x23:
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

export const getAdaAccountTotalStakingBalance = (account: Account) =>
    account?.networkType === 'cardano' && account.misc?.staking?.isActive
        ? subunitsToUnits({
              value: asAmountSubunit(new BigNumber(account.balance)),
              symbol: account.symbol,
          }).toString()
        : null;

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
