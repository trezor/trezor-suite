import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type Account,
    type SupportedEthereumNetworkSymbol,
    supportedNetworkSymbols,
} from '@suite-common/wallet-types';
import { fromHex, getSignatureByEthereumDataHex, isUnstakeTx } from '@suite-common/wallet-utils';
import { BigNumber, isArrayMember } from '@trezor/utils';

import { getEthereumStakingAdapter } from './providers/ethereumStakingProviders';
import { deriveEthereumStakingPositions } from '../positions/deriveStakingPositions';

// Only pooled positions add to the native balance; a liquid position is already counted as a token.
export const getEthereumCryptoBalanceWithStaking = (account: Account) =>
    deriveEthereumStakingPositions(account)
        .filter(
            position => getEthereumStakingAdapter(position.providerId).contributesToNativeBalance,
        )
        .reduce(
            (balance, position) => balance.plus(position.total),
            new BigNumber(account.formattedBalance),
        )
        .toString();

export function isSupportedEthStakingNetworkSymbol(
    symbol: NetworkSymbol,
): symbol is SupportedEthereumNetworkSymbol {
    return isArrayMember(symbol, supportedNetworkSymbols);
}

export const getUnstakeAmountByEthereumDataHex = (dataHex?: string) => {
    if (!dataHex) return null;

    // Check if the first two characters are '0x' and remove them if they are
    const data = dataHex.startsWith('0x') ? dataHex.slice(2) : dataHex;

    const signature = getSignatureByEthereumDataHex(data);
    if (!isUnstakeTx(signature)) return null;

    const dataBuffer = Buffer.from(data, 'hex');

    return fromHex(`0x${dataBuffer.subarray(4, 36).toString('hex')}`).toIntegerString();
};

export const hasStakeInPendingDepositedState = (account: Account) => {
    if (account?.networkType !== 'ethereum') return false;

    const position = deriveEthereumStakingPositions(account).find(
        ({ details }) => details.providerId === 'everstake',
    );

    if (!position) return false;

    const { pendingDepositedBalance, pendingBalance } = position.details.pool;

    return new BigNumber(pendingDepositedBalance).gt(0) && new BigNumber(pendingBalance).lte(0);
};
