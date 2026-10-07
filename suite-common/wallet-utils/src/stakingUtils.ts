import {
    type NetworkSymbol,
    type NetworkType,
    STAKING_SYMBOLS,
    STAKING_TYPES,
    type StakingNetworkSymbol,
    type StakingNetworkType,
} from '@suite-common/wallet-config';
import {
    type Account,
    type FormState,
    type StakeFormState,
    type StakingPoolExtended,
} from '@suite-common/wallet-types';
import {
    type SolanaStakingAccount,
    type TronAccountExtraData,
    type TronStakingInfo,
} from '@trezor/blockchain-link-types';
import {
    getSignatureByEthereumDataHex,
    getTxStakeNameByDataHex,
    isClaimTx,
    isStakeTx,
    isStakeTypeTx,
    isUnstakeTx,
    signatureToStakeTypeMap,
} from '@trezor/network-ethereum-suite-common';
import { BigNumber } from '@trezor/utils';

import { asAmountSubunit } from './AmountTypes';
import { formatNetworkAmount, subunitsToUnits } from './amountUtils';
import { fromWei } from './ethConverter';

// Low-level staking accessors required by generic wallet-utils modules
// (`accountUtils`, `reviewTransactionUtils`). Higher-level staking logic lives in
// `@suite-common/wallet-core/staking`, which may depend on these primitives, but
// `wallet-utils` cannot depend on `wallet-core`.

export const secondsToDays = (seconds: number) => Math.round(seconds / 60 / 60 / 24);

export const isStakingNetworkType = (type: NetworkType): type is StakingNetworkType =>
    (STAKING_TYPES as readonly string[]).includes(type);

export const isStakingSymbol = (
    symbol: NetworkSymbol,
): symbol is NetworkSymbol & StakingNetworkSymbol =>
    (STAKING_SYMBOLS as readonly string[]).includes(symbol);

const getEverstakePool = (account?: Account) => {
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

export const getEthAccountTotalStakingBalance = (account?: Account) => {
    const pool = getAccountEverstakeStakingPool(account);

    return new BigNumber(pool?.autocompoundBalance ?? '0')
        .plus(pool?.pendingBalance ?? '0')
        .plus(pool?.pendingDepositedBalance ?? '0')
        .plus(pool?.withdrawTotalAmount ?? '0')
        .toFixed();
};

export const calculateTotalSolStakingBalance = (stakingAccounts: SolanaStakingAccount[]) => {
    if (!stakingAccounts?.length) return null;

    const totalAmount = stakingAccounts.reduce((acc, account) => {
        if (account?.stake) {
            const delegationStake = account.stake?.toString();

            if (delegationStake != null) {
                return acc.plus(delegationStake);
            }
        }

        return acc;
    }, new BigNumber(0));

    return totalAmount.toString();
};

export const getSolAccountTotalStakingBalance = (account: Account) => {
    if (!account?.misc || account.networkType !== 'solana') {
        return null;
    }

    const { solStakingAccounts } = account.misc;
    if (!solStakingAccounts) return null;

    const totalStakingBalance = calculateTotalSolStakingBalance(solStakingAccounts);
    if (!totalStakingBalance) return null;

    return formatNetworkAmount(totalStakingBalance, account.symbol);
};

export const getAdaAccountTotalStakingBalance = (account: Account) =>
    account?.networkType === 'cardano' && account.misc?.staking?.isActive
        ? subunitsToUnits({
              value: asAmountSubunit(new BigNumber(account.balance)),
              symbol: account.symbol,
          }).toString()
        : null;

export const sunToTrx = (sun: string, symbol: NetworkSymbol) =>
    subunitsToUnits({
        value: asAmountSubunit(new BigNumber(sun)),
        symbol,
    }).toString();

export const getTronResources = (account?: Account): TronAccountExtraData | undefined =>
    account?.networkType === 'tron' ? account.misc?.tronResources : undefined;

export const getTronStakingInfo = (account?: Account): TronStakingInfo | undefined =>
    getTronResources(account)?.stakingInfo;

export const getTronAccountTotalStakingBalance = (account: Account): string | null => {
    const stakingInfo = getTronStakingInfo(account);
    if (!stakingInfo) return null;

    return sunToTrx(stakingInfo.stakedBalance, account.symbol);
};

const STAKING_BALANCE_BY_TYPE = {
    ethereum: getEthAccountTotalStakingBalance,
    solana: getSolAccountTotalStakingBalance,
    cardano: getAdaAccountTotalStakingBalance,
    tron: getTronAccountTotalStakingBalance,
} satisfies Record<StakingNetworkType, (a: Account) => string | null>;

export const getAccountTotalStakingBalance = (account: Account) =>
    isStakingNetworkType(account.networkType)
        ? STAKING_BALANCE_BY_TYPE[account.networkType]?.(account)
        : null;

export {
    getSignatureByEthereumDataHex,
    getTxStakeNameByDataHex,
    isClaimTx,
    isStakeTx,
    isStakeTypeTx,
    isUnstakeTx,
    signatureToStakeTypeMap,
};

const isStakeForm = (form: FormState | StakeFormState): form is StakeFormState =>
    'stakeType' in form;

export const getStakeType = (precomposedForm: FormState) =>
    isStakeForm(precomposedForm)
        ? precomposedForm.stakeType
        : getTxStakeNameByDataHex(precomposedForm.transactionData);
