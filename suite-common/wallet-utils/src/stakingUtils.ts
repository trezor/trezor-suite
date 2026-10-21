import {
    type NetworkSymbol,
    type NetworkType,
    STAKING_SYMBOLS,
    STAKING_TYPES,
    type StakingNetworkSymbol,
    type StakingNetworkType,
    getStakingProviderByEthereumContract,
} from '@suite-common/wallet-config';
import {
    type Account,
    type FormState,
    type StakeFormState,
    type StakeType,
} from '@suite-common/wallet-types';
import {
    type SolanaStakingAccount,
    type StakingPool,
    type TronAccountExtraData,
    type TronStakingInfo,
} from '@trezor/blockchain-link-types';
import {
    type EverstakeOperation,
    getEverstakeOperationBySelector,
} from '@trezor/network-ethereum/staking';
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

// Pools of known pooled providers, located by contract address. Liquid positions live in the
// token balance and never add to the native balance.
export const getEthereumAccountStakingPools = (account?: Account): StakingPool[] => {
    if (account?.networkType !== 'ethereum') return [];

    return (account.misc?.stakingPools ?? []).filter(
        pool =>
            getStakingProviderByEthereumContract(account.symbol, pool.contract)?.ethereum?.kind ===
            'pooled',
    );
};

// What the account gets back by exiting the pool: earning, pending and requested balances.
export const getStakingPoolTotalBalance = (pool: StakingPool) =>
    fromWei(
        new BigNumber(pool.autocompoundBalance)
            .plus(pool.pendingBalance)
            .plus(pool.pendingDepositedBalance)
            .plus(pool.withdrawTotalAmount)
            .toString(),
    ).toEther('bignumber');

export const getEthAccountTotalStakingBalance = (account?: Account) =>
    getEthereumAccountStakingPools(account)
        .reduce((total, pool) => total.plus(getStakingPoolTotalBalance(pool)), new BigNumber(0))
        .toFixed();

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

export const getSignatureByEthereumDataHex = (dataHex: string) => {
    const cleanHex = dataHex.startsWith('0x') ? dataHex.slice(2) : dataHex;

    return `0x${cleanHex.slice(0, 8)}`;
};

const EVERSTAKE_OPERATION_TO_STAKE_TYPE: Record<EverstakeOperation, StakeType> = {
    stake: 'stake',
    unstake: 'unstake',
    claimWithdrawRequest: 'claim',
};

// Selector-only read for review screens of drafts that carry raw calldata; the provider-aware
// classification lives in wallet-core.
export const getTxStakeNameByDataHex = (dataHex: string | undefined): StakeType | null => {
    if (!dataHex) return null;

    const operation = getEverstakeOperationBySelector(getSignatureByEthereumDataHex(dataHex));

    return operation ? EVERSTAKE_OPERATION_TO_STAKE_TYPE[operation] : null;
};

const isStakeForm = (form: FormState | StakeFormState): form is StakeFormState =>
    'stakeType' in form;

export const getStakeType = (precomposedForm: FormState) =>
    isStakeForm(precomposedForm)
        ? precomposedForm.stakeType
        : getTxStakeNameByDataHex(precomposedForm.transactionData);
