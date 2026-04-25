import { useCallback, useMemo, useState } from 'react';

import { type StakingNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import {
    getAccountTotalStakingBalance,
    getStakingLimitsByNetworkSymbol,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
import { BigNumber, arrayPartition } from '@trezor/utils';

interface UseAccountVisibilityProps {
    stakingAccounts: Account[];
    currentRates: Record<StakingNetworkSymbol, number | undefined>;
    ethNotActivated: boolean;
    solNotActivated: boolean;
    adaNotActivated: boolean;
}

export const useStakingAccountsVisibility = ({
    stakingAccounts,
    currentRates,
    ethNotActivated,
    solNotActivated,
    adaNotActivated,
}: UseAccountVisibilityProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpanded = useCallback(() => {
        setIsExpanded(prev => !prev);
    }, []);

    const sortAccountsByStakedAmount = useCallback(
        (a: Account, b: Account) => {
            const getAccountStakedAmountInFiat = (account: Account) => {
                const stakedAmountInCrypto = getAccountTotalStakingBalance(account) ?? '0';
                const fiatCurrency = toFiatCurrency({
                    amount: stakedAmountInCrypto,
                    rate: currentRates[account.symbol as StakingNetworkSymbol],
                });

                return new BigNumber(fiatCurrency ?? '0');
            };

            const aStakedAmount = getAccountStakedAmountInFiat(a);
            const bStakedAmount = getAccountStakedAmountInFiat(b);

            return bStakedAmount.minus(aStakedAmount).toNumber();
        },
        [currentRates],
    );

    const sortAccountsByBalance = useCallback(
        (a: Account, b: Account) => {
            const getAccountBalanceInFiat = (account: Account) => {
                const fiatCurrency = toFiatCurrency({
                    amount: account.formattedBalance,
                    rate: currentRates[account.symbol as StakingNetworkSymbol],
                });

                return new BigNumber(fiatCurrency ?? '0');
            };

            const aAccountBalance = getAccountBalanceInFiat(a);
            const bAccountBalance = getAccountBalanceInFiat(b);

            return bAccountBalance.minus(aAccountBalance).toNumber();
        },
        [currentRates],
    );

    const [accountsStakingActive, accountsStakingNotActive] = arrayPartition(
        stakingAccounts,
        (account: Account) => {
            const stakedAmount = getAccountTotalStakingBalance(account);

            return stakedAmount !== null && stakedAmount !== '0';
        },
    );

    const [accountsSufficientFunds, accountsInsufficientFunds] = arrayPartition(
        accountsStakingNotActive,
        (account: Account) => {
            const minStakingAmount = getStakingLimitsByNetworkSymbol(
                account.symbol,
            )?.MIN_AMOUNT_FOR_STAKING_DASHBOARD;

            return (
                minStakingAmount !== undefined &&
                new BigNumber(account.formattedBalance).gte(minStakingAmount)
            );
        },
    );

    const alwaysVisibleAccounts = useMemo(
        () => [
            ...accountsStakingActive.toSorted(sortAccountsByStakedAmount),
            ...accountsSufficientFunds.toSorted(sortAccountsByBalance),
        ],
        [
            accountsStakingActive,
            accountsSufficientFunds,
            sortAccountsByStakedAmount,
            sortAccountsByBalance,
        ],
    );

    const collapsedInsufficientFundsAccounts = useMemo(() => {
        const hasEthBaseAccount = alwaysVisibleAccounts.some(account => account.symbol === 'eth');
        const hasSolBaseAccount = alwaysVisibleAccounts.some(account => account.symbol === 'sol');
        const hasAdaBaseAccount = alwaysVisibleAccounts.some(account => account.symbol === 'ada');

        const sortedInsufficientFundsAccounts =
            accountsInsufficientFunds.toSorted(sortAccountsByBalance);

        const additionalAccounts: Account[] = [];

        if (!hasEthBaseAccount && !ethNotActivated) {
            const account = sortedInsufficientFundsAccounts.find(
                account => account.symbol === 'eth',
            );

            if (account) additionalAccounts.push(account);
        }

        if (!hasSolBaseAccount && !solNotActivated) {
            const account = sortedInsufficientFundsAccounts.find(
                account => account.symbol === 'sol',
            );

            if (account) additionalAccounts.push(account);
        }

        if (!hasAdaBaseAccount && !adaNotActivated) {
            const account = sortedInsufficientFundsAccounts.find(
                account => account.symbol === 'ada',
            );

            if (account) additionalAccounts.push(account);
        }

        return additionalAccounts.toSorted(sortAccountsByBalance);
    }, [
        alwaysVisibleAccounts,
        accountsInsufficientFunds,
        ethNotActivated,
        solNotActivated,
        adaNotActivated,
        sortAccountsByBalance,
    ]);

    const collapsedAccounts = [...alwaysVisibleAccounts, ...collapsedInsufficientFundsAccounts];

    const expandedAccounts = [
        ...alwaysVisibleAccounts,
        ...accountsInsufficientFunds.toSorted(sortAccountsByBalance),
    ];

    const displayedAccounts = isExpanded ? expandedAccounts : collapsedAccounts;
    const isExpandable = collapsedAccounts.length !== expandedAccounts.length;

    const hasAnyRewardsData =
        accountsStakingActive.length > 0 || accountsSufficientFunds.length > 0;

    return { displayedAccounts, isExpanded, toggleExpanded, isExpandable, hasAnyRewardsData };
};
