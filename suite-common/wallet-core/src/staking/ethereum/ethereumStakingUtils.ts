import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type Account,
    type SupportedEthereumNetworkSymbol,
    supportedNetworkSymbols,
} from '@suite-common/wallet-types';
import {
    fromHex,
    getAccountEverstakeStakingPool,
    getEthAccountTotalStakingBalance,
    getSignatureByEthereumDataHex,
    isUnstakeTx,
} from '@suite-common/wallet-utils';
import { BigNumber, isArrayMember } from '@trezor/utils';

export const getAccountAutocompoundBalance = (account?: Account) => {
    const pool = getAccountEverstakeStakingPool(account);

    return pool?.autocompoundBalance ?? '0';
};

export const getEthereumCryptoBalanceWithStaking = (account: Account) => {
    const stakingBalance = getEthAccountTotalStakingBalance(account);

    return new BigNumber(account.formattedBalance).plus(stakingBalance).toString();
};

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

    const pool = getAccountEverstakeStakingPool(account);
    if (!pool) return false;

    const { pendingDepositedBalance, pendingBalance } = pool;

    if (new BigNumber(pendingDepositedBalance).gt(0) && new BigNumber(pendingBalance).lte(0)) {
        return true;
    }

    return false;
};
