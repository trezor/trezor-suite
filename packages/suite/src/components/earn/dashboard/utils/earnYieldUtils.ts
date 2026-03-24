import { BalanceType, type YieldBalancesDto } from '@suite-common/earn-api';
import { BigNumber } from '@trezor/utils';

export const getYieldAddressKey = (yieldId: string, address: string) =>
    `${yieldId}:${address.toLowerCase()}`;

const SUPPLIED_BALANCE_TYPES = new Set<BalanceType>([BalanceType.active, BalanceType.entering]);

export const getSuppliedBalancesByYieldAndAddress = (items: YieldBalancesDto[]) =>
    items.reduce((acc, item) => {
        item.balances.forEach(balance => {
            if (!SUPPLIED_BALANCE_TYPES.has(balance.type)) {
                return;
            }

            const key = getYieldAddressKey(item.yieldId, balance.address);
            const previousAmount = acc.get(key) ?? '0';
            const nextAmount = new BigNumber(previousAmount).plus(balance.amount).toString();

            acc.set(key, nextAmount);
        });

        return acc;
    }, new Map<string, string>());

type YieldRowWithAvailableBalance = {
    additionalSupplyAmount: string;
    matchedToken: unknown;
    account?: {
        formattedBalance: string;
    };
};

type YieldRowWithSuppliedBalance = {
    suppliedAmount: string;
};

const getYieldAvailableBalanceForSorting = (row: YieldRowWithAvailableBalance) =>
    row.matchedToken ? row.additionalSupplyAmount : (row.account?.formattedBalance ?? '0');

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
