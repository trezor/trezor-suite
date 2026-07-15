import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type Account,
    type FormState,
    type StakeFormState,
    type StakeType,
    type StakingPoolExtended,
    type SupportedEthereumNetworkSymbol,
    supportedNetworkSymbols,
} from '@suite-common/wallet-types';
import { BigNumber, isArrayMember } from '@trezor/utils';

import { fromHex, fromWei } from './ethConverter';

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
        autocompoundBalance: fromWei(pool.autocompoundBalance).toEther(),
        claimableAmount: fromWei(pool.claimableAmount).toEther(),
        depositedBalance: fromWei(pool.depositedBalance).toEther(),
        pendingBalance: fromWei(pool.pendingBalance).toEther(),
        pendingDepositedBalance: fromWei(pool.pendingDepositedBalance).toEther(),
        restakedReward: fromWei(pool.restakedReward).toEther(),
        withdrawTotalAmount: fromWei(pool.withdrawTotalAmount).toEther(),
        totalPendingStakeBalance: fromWei(
            new BigNumber(pool.pendingBalance).plus(pool.pendingDepositedBalance).toString(),
        ).toEther(),
        canClaim:
            new BigNumber(pool.claimableAmount).gt(0) &&
            new BigNumber(pool.withdrawTotalAmount).eq(pool.claimableAmount),
    };
};

export const getAccountAutocompoundBalance = (account?: Account) => {
    const pool = getAccountEverstakeStakingPool(account);

    return pool?.autocompoundBalance ?? '0';
};

export const getEthAccountTotalStakingBalance = (account?: Account) => {
    const pool = getAccountEverstakeStakingPool(account);

    return new BigNumber(pool?.autocompoundBalance ?? '0')
        .plus(pool?.pendingBalance ?? '0')
        .plus(pool?.pendingDepositedBalance ?? '0')
        .plus(pool?.withdrawTotalAmount ?? '0')
        .toFixed();
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

// Define signature constants
const STAKE_SIGNATURE = '0x3a29dbae';
const UNSTAKE_SIGNATURE = '0x76ec871c';
const CLAIM_SIGNATURE = '0x33986ffa';

export const signatureToStakeTypeMap: { [key: string]: StakeType } = {
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

export const getSignatureByEthereumDataHex = (dataHex: string) => {
    const cleanHex = dataHex.startsWith('0x') ? dataHex.slice(2) : dataHex;

    return `0x${cleanHex.slice(0, 8)}`;
};
export const getTxStakeNameByDataHex = (dataHex: string | undefined): StakeType | null => {
    if (!dataHex) return null;
    const signature = getSignatureByEthereumDataHex(dataHex);

    if (!isStakeTypeTx(signature)) return null;
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const stakeType: StakeType = signatureToStakeTypeMap[signature];

    return stakeType;
};

export const getUnstakeAmountByEthereumDataHex = (dataHex?: string) => {
    if (!dataHex) return null;

    // Check if the first two characters are '0x' and remove them if they are
    const data = dataHex.startsWith('0x') ? dataHex.slice(2) : dataHex;

    const signature = getSignatureByEthereumDataHex(data);
    if (!isUnstakeTx(signature)) return null;

    const dataBuffer = Buffer.from(data, 'hex');

    return fromHex(`0x${dataBuffer.subarray(4, 36).toString('hex')}`).toIntegerString();
};

export const isStakeForm = (form: FormState | StakeFormState): form is StakeFormState =>
    'stakeType' in form;

export const getStakeType = (precomposedForm: FormState) =>
    isStakeForm(precomposedForm)
        ? precomposedForm.stakeType
        : getTxStakeNameByDataHex(precomposedForm.transactionData);

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
