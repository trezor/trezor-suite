import { ChainAddressKey } from '@suite-common/earn-stablecoin-api';
import { getNetworkByEvmChainId } from '@suite-common/wallet-config';
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
        const { chainId, address } = ChainAddressKey.parse(key);
        const network = getNetworkByEvmChainId(Number(chainId));

        const account = visibleAccounts.find(
            a =>
                a.symbol === network?.symbol &&
                a.descriptor.toLowerCase() === address.toLowerCase(),
        );

        if (!account) {
            return [];
        }

        const claimableRewards = accountRewards.filter(reward =>
            new BigNumber(reward.claimable).gt(0),
        );

        if (claimableRewards.length === 0) {
            return [];
        }

        const hasAnyFiatAmount = claimableRewards.some(reward => reward.fiat.claimable !== null);
        const totalFiatAmount = claimableRewards.reduce(
            (total, reward) => total.plus(reward.fiat.claimable ?? '0'),
            new BigNumber(0),
        );

        return [
            {
                account,
                totalFiatAmount: hasAnyFiatAmount ? asBaseCurrencyAmount(totalFiatAmount) : null,
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
