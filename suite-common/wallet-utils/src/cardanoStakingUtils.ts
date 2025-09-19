import { NetworkSymbol } from '@suite-common/wallet-config';
import { CARDANO_EVERSTAKE_STAKING_POOL } from '@suite-common/wallet-constants';
import {
    Account,
    SupportedCardanoNetworkSymbols,
    supportedCardanoNetworkSymbols,
} from '@suite-common/wallet-types';
import { isArrayMember } from '@trezor/utils';

export function isSupportedAdaStakingNetworkSymbol(
    symbol: NetworkSymbol,
): symbol is SupportedCardanoNetworkSymbols {
    return isArrayMember(symbol, supportedCardanoNetworkSymbols);
}

export const isCardanoStakedWithEverstake = (account: Account) => {
    if (!account) return false;

    if (account.networkType !== 'cardano') return false;

    return account?.misc.staking.poolId === CARDANO_EVERSTAKE_STAKING_POOL.bech32;
};
