import { ChainAddressKey } from '@suite-common/earn-stablecoin-api';
import {
    type AccountType,
    getNetworkByEvmChainId,
    networkSymbolCollection,
    networks,
} from '@suite-common/wallet-config';
import { type Account, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

import { type EarnYieldClaimableAccount } from '../yield/EarnYieldClaimSelectAccountModal';
import { type MerkleRewardsWithFiatRecord } from '../yield/hooks/useMerkleRewards';

type GetClaimableAccountsParams = {
    rewards: MerkleRewardsWithFiatRecord;
    visibleAccounts: Account[];
};

export const getClaimableAccounts = ({
    rewards,
    visibleAccounts,
}: GetClaimableAccountsParams): EarnYieldClaimableAccount[] =>
    Object.entries(rewards).flatMap(([key, accountRewards]) => {
        const totalClaimable = accountRewards.reduce(
            (total, reward) => total.plus(reward.claimable),
            new BigNumber(0),
        );

        if (!totalClaimable.gt(0)) {
            return [];
        }

        const { chainId, address } = ChainAddressKey.parse(key);
        const network = getNetworkByEvmChainId(chainId);
        const account = visibleAccounts.find(
            a =>
                a.symbol === network?.symbol &&
                a.descriptor.toLowerCase() === address.toLowerCase(),
        );

        if (!account) {
            return [];
        }

        const totalFiatAmount = accountRewards.reduce(
            (total, reward) => total.plus(reward.fiat.claimable ?? '0'),
            new BigNumber(0),
        );

        return [
            {
                account,
                totalFiatAmount: totalFiatAmount.isPositive()
                    ? asBaseCurrencyAmount(totalFiatAmount)
                    : null,
            },
        ];
    });

type YieldRowWithAvailableBalance = {
    additionalSupplyAmount: string;
    matchedInputToken: unknown;
    account?: {
        formattedBalance: string;
    };
};

type YieldRowWithSuppliedBalance = {
    suppliedAmount: string;
};

const getYieldAvailableBalanceForSorting = (row: YieldRowWithAvailableBalance) =>
    row.matchedInputToken ? row.additionalSupplyAmount : (row.account?.formattedBalance ?? '0');

export const compareYieldRowsBySuppliedAmountDesc = (
    a: YieldRowWithSuppliedBalance,
    b: YieldRowWithSuppliedBalance,
) => new BigNumber(b.suppliedAmount).comparedTo(a.suppliedAmount) ?? 0;

export const compareYieldRowsByAvailableBalanceDesc = (
    a: YieldRowWithAvailableBalance,
    b: YieldRowWithAvailableBalance,
) =>
    new BigNumber(getYieldAvailableBalanceForSorting(b)).comparedTo(
        getYieldAvailableBalanceForSorting(a),
    ) ?? 0;

type YieldRowWithAccount = {
    account?: Pick<Account, 'symbol' | 'accountType' | 'index'>;
    suppliedSymbol?: string;
};

/**
 * Groups rows by network only (in networkSymbolCollection order). Used for the deposited and
 * deposit buckets so a stable secondary sort by balance/supplied amount actually controls
 * the within-network order.
 */
export const compareYieldRowsByNetworkOnly = (a: YieldRowWithAccount, b: YieldRowWithAccount) => {
    if (!a.account || !b.account) return 0;

    const aSymbolIndex = networkSymbolCollection.indexOf(a.account.symbol);
    const bSymbolIndex = networkSymbolCollection.indexOf(b.account.symbol);

    return aSymbolIndex - bSymbolIndex;
};

/**
 * Groups by network → token symbol → account type → account index. Used for the depositable
 * and no-balance buckets so rows on the same network and token stay together regardless of
 * account type (normal/legacy/ledger).
 */
export const compareYieldRowsByTokenNetworkOrder = (
    a: YieldRowWithAccount,
    b: YieldRowWithAccount,
) => {
    if (!a.account || !b.account) return 0;

    const aSymbolIndex = networkSymbolCollection.indexOf(a.account.symbol);
    const bSymbolIndex = networkSymbolCollection.indexOf(b.account.symbol);
    if (aSymbolIndex !== bSymbolIndex) return aSymbolIndex - bSymbolIndex;

    if (a.suppliedSymbol && b.suppliedSymbol && a.suppliedSymbol !== b.suppliedSymbol) {
        return a.suppliedSymbol.localeCompare(b.suppliedSymbol);
    }

    const network = networks[a.account.symbol];
    const orderedAccountTypes = Object.keys(network.accountTypes) as AccountType[];
    const aAccountTypeIndex = orderedAccountTypes.indexOf(a.account.accountType);
    const bAccountTypeIndex = orderedAccountTypes.indexOf(b.account.accountType);
    if (aAccountTypeIndex !== bAccountTypeIndex) return aAccountTypeIndex - bAccountTypeIndex;

    return a.account.index - b.account.index;
};
