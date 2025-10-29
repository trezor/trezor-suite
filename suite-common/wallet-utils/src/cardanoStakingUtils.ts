import { bech32 } from 'bech32';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { CARDANO_EVERSTAKE_STAKING_POOL } from '@suite-common/wallet-constants';
import {
    Account,
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

export const isCardanoStakedWithEverstake = (account: Account) => {
    if (!account) return false;

    if (account.networkType !== 'cardano') return false;

    return account?.misc.staking.poolId === CARDANO_EVERSTAKE_STAKING_POOL.bech32;
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
