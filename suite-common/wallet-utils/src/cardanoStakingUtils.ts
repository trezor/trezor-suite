import { bech32 } from 'bech32';

import { NetworkSymbol, getNetworkFeatures } from '@suite-common/wallet-config';
import {
    CARDANO_EVERSTAKE_STAKING_POOL,
    CARDANO_POOL_SATURATION_SAFE_THRESHOLD,
    FIVE_BINARIES_POOLS,
} from '@suite-common/wallet-constants';
import {
    Account,
    CardanoPoolInfo,
    StakeType,
    SupportedCardanoNetworkSymbols,
    supportedCardanoNetworkSymbols,
} from '@suite-common/wallet-types';
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

const getAccountPoolId = (account?: Account) => {
    if (!account) return null;
    if (account.networkType !== 'cardano') return null;

    const poolId = account.misc?.staking?.poolId;

    return poolId || null;
};

export const isCardanoStakedWithEverstake = (
    account: Account,
    cardanoStakingPools: CardanoPoolInfo[],
) => {
    if (!cardanoStakingPools?.length) return false;

    const accountPoolId = getAccountPoolId(account);
    if (!accountPoolId) return false;

    return cardanoStakingPools.some(pool => pool.id === accountPoolId);
};

export const isCardanoStakedOutsideEverstake = (
    account: Account,
    cardanoStakingPools: CardanoPoolInfo[],
) => {
    if (!cardanoStakingPools?.length) return false;

    const accountPoolId = getAccountPoolId(account);
    if (!accountPoolId) return false;

    return cardanoStakingPools.every(pool => pool.id !== accountPoolId);
};

export const isCardanoStakedWithFiveBinaries = (account: Account) => {
    const accountPoolId = getAccountPoolId(account);
    if (!accountPoolId) return false;

    return FIVE_BINARIES_POOLS.includes(accountPoolId);
};

export const poolBech32ToHex = (poolId: string): string => {
    const decoded = bech32.decode(poolId);
    const bytes = bech32.fromWords(decoded.words);

    return Buffer.from(bytes).toString('hex');
};

export const selectBestCardanoPool = (pools?: CardanoPoolInfo[]) => {
    if (!pools || pools.length === 0) return CARDANO_EVERSTAKE_STAKING_POOL;

    // sort from highest saturation to lowest
    const sortedPools = [...pools].sort((a, b) => b.saturation - a.saturation);

    // find the one within the threshold
    const bestPool = sortedPools.find(
        pool => pool.saturation < CARDANO_POOL_SATURATION_SAFE_THRESHOLD,
    );

    if (bestPool) {
        return {
            hex: poolBech32ToHex(bestPool.id),
            bech32: bestPool.id,
        };
    }

    // pick the last one (lowest saturation)
    const fallback = sortedPools[sortedPools.length - 1];

    return {
        hex: poolBech32ToHex(fallback.id),
        bech32: fallback.id,
    };
};

export const validateCardanoDrep = (drepId: string): boolean => {
    try {
        const { prefix, words } = bech32.decode(drepId);
        if (prefix !== 'drep') return false;

        const bytes = bech32.fromWords(words);
        if (bytes.length !== 28 && bytes.length !== 29) return false;

        return true;
    } catch {
        return false;
    }
};

export const drepBech32ToKeyHashHex = (drepId: string): string => {
    if (!validateCardanoDrep(drepId)) throw new Error('Not a DRep bech32');

    const { words } = bech32.decode(drepId);
    const bytes = bech32.fromWords(words);

    // 29-byte hash strip the tag
    if (bytes.length === 29 && bytes[0] === 0x22) {
        return Buffer.from(bytes.slice(1)).toString('hex');
    }

    // 28-byte hash
    if (bytes.length === 28) {
        return Buffer.from(bytes).toString('hex');
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

export const subtypeToStakeTypeMap: { [key: string]: StakeType } = {
    stake_delegation: 'stake',
    stake_deregistration: 'unstake',
    withdrawal: 'claim',
};
