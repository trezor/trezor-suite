import { BigNumber } from '@trezor/utils';

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
