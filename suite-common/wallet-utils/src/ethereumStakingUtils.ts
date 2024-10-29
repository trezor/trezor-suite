import { fromWei, hexToNumberString } from 'web3-utils';

import {
    Account,
    StakingPoolExtended,
    StakeType,
    supportedNetworkSymbols,
    SupportedNetworkSymbol,
} from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils/src/bigNumber';
import { NetworkSymbol, getNetworkFeatures } from '@suite-common/wallet-config';
import { isArrayMember } from '@trezor/utils';

export const getEverstakePool = (account?: Account) => {
    if (account?.networkType !== 'ethereum') {
        return undefined;
    }

    return account?.misc?.stakingPools?.find(pool => pool.name === 'Everstake');
};

export const getAccountEverstakeStakingPool = (
    account?: Account,
): StakingPoolExtended | undefined => {
    const pool = getEverstakePool(account);

    if (!pool) return undefined;

    return {
        ...pool,
        autocompoundBalance: fromWei(pool.autocompoundBalance, 'ether'),
        claimableAmount: fromWei(pool.claimableAmount, 'ether'),
        depositedBalance: fromWei(pool.depositedBalance, 'ether'),
        pendingBalance: fromWei(pool.pendingBalance, 'ether'),
        pendingDepositedBalance: fromWei(pool.pendingDepositedBalance, 'ether'),
        restakedReward: fromWei(pool.restakedReward, 'ether'),
        withdrawTotalAmount: fromWei(pool.withdrawTotalAmount, 'ether'),
        totalPendingStakeBalance: fromWei(
            new BigNumber(pool.pendingBalance).plus(pool.pendingDepositedBalance).toString(),
            'ether',
        ),
        canClaim:
            new BigNumber(pool.claimableAmount).gt(0) &&
            new BigNumber(pool.withdrawTotalAmount).eq(pool.claimableAmount),
    };
};

export const getAccountAutocompoundBalance = (account?: Account) => {
    const pool = getAccountEverstakeStakingPool(account);

    return pool?.autocompoundBalance ?? '0';
};

export const getAccountTotalStakingBalance = (account?: Account) => {
    const pool = getAccountEverstakeStakingPool(account);

    return new BigNumber(pool?.autocompoundBalance ?? '0')
        .plus(pool?.pendingBalance ?? '0')
        .plus(pool?.pendingDepositedBalance ?? '0')
        .plus(pool?.withdrawTotalAmount ?? '0')
        .toFixed();
};

export const getEthereumCryptoBalanceWithStaking = (account: Account) => {
    const stakingBalance = getAccountTotalStakingBalance(account);

    return new BigNumber(account.formattedBalance).plus(stakingBalance).toString();
};

export function isSupportedEthStakingNetworkSymbol(
    networkSymbol: NetworkSymbol,
): networkSymbol is SupportedNetworkSymbol {
    return isArrayMember(networkSymbol, supportedNetworkSymbols);
}

export const getStakingSymbols = (networkSymbols: NetworkSymbol[]) =>
    networkSymbols.reduce((acc, networkSymbol) => {
        if (
            isSupportedEthStakingNetworkSymbol(networkSymbol) &&
            getNetworkFeatures(networkSymbol).includes('staking')
        ) {
            acc.push(networkSymbol);
        }

        return acc;
    }, [] as SupportedNetworkSymbol[]);

// Define signature constants
const STAKE_SIGNATURE = '0x3a29dbae';
const UNSTAKE_SIGNATURE = '0x76ec871c';
const CLAIM_SIGNATURE = '0x33986ffa';

export const signatureToStakeNameMap: { [key: string]: StakeType } = {
    [STAKE_SIGNATURE]: 'stake',
    [UNSTAKE_SIGNATURE]: 'unstake',
    [CLAIM_SIGNATURE]: 'claim',
};

export const isStakeTx = (signature: string | undefined) =>
    signature?.toLowerCase() === STAKE_SIGNATURE;

export const isUnstakeTx = (signature: string | undefined) =>
    signature?.toLowerCase() === UNSTAKE_SIGNATURE;

export const isClaimTx = (signature: string | undefined) =>
    signature?.toLowerCase() === CLAIM_SIGNATURE;

export const isStakeTypeTx = (signature: string | undefined) =>
    isStakeTx(signature) || isUnstakeTx(signature) || isClaimTx(signature);

export const getSignatureByEthereumDataHex = (dataHex: string) => `0x${dataHex.slice(0, 8)}`;

export const getTxStakeNameByDataHex = (dataHex: string | undefined): StakeType | null => {
    if (!dataHex) return null;
    const signature = getSignatureByEthereumDataHex(dataHex);

    return isStakeTypeTx(signature) ? signatureToStakeNameMap[signature] : null;
};

export const getUnstakeAmountByEthereumDataHex = (dataHex?: string) => {
    if (!dataHex) return null;

    // Check if the first two characters are '0x' and remove them if they are
    const data = dataHex.startsWith('0x') ? dataHex.slice(2) : dataHex;

    const signature = getSignatureByEthereumDataHex(data);
    if (!isUnstakeTx(signature)) return null;

    const dataBuffer = Buffer.from(data, 'hex');

    return hexToNumberString(`0x${dataBuffer.subarray(4, 36).toString('hex')}`);
};
