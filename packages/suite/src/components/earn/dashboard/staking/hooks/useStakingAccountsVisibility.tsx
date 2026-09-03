import { useCallback, useMemo, useState } from 'react';

import { type StakingNetworkSymbol } from '@suite-common/wallet-config';
import { getStakingLimitsByNetworkSymbol } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import {
    compareEarnByAmountDesc,
    getAccountTotalStakingBalance,
    isStakingSymbol,
    sortByCoin,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
import { BigNumber, arrayPartition } from '@trezor/utils';

interface UseAccountVisibilityProps {
    stakingAccounts: Account[];
    currentRates: Record<StakingNetworkSymbol, number | undefined>;
    ethNotActivated: boolean;
    solNotActivated: boolean;
    adaNotActivated: boolean;
    trxNotActivated: boolean;
}

export const useStakingAccountsVisibility = ({
    stakingAccounts,
    currentRates,
    ethNotActivated,
    solNotActivated,
    adaNotActivated,
    trxNotActivated,
}: UseAccountVisibilityProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpanded = useCallback(() => {
        setIsExpanded(prev => !prev);
    }, []);

    const getAccountStakedAmountInFiat = useCallback(
        (account: Account) =>
            toFiatCurrency({
                amount: getAccountTotalStakingBalance(account) ?? '0',
                rate: isStakingSymbol(account.symbol) ? currentRates[account.symbol] : undefined,
            }) ?? '0',
        [currentRates],
    );

    const getAccountBalanceInFiat = useCallback(
        (account: Account) =>
            toFiatCurrency({
                amount: account.formattedBalance,
                rate: isStakingSymbol(account.symbol) ? currentRates[account.symbol] : undefined,
            }) ?? '0',
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
            ...accountsStakingActive.toSorted(
                compareEarnByAmountDesc(getAccountStakedAmountInFiat),
            ),
            ...accountsSufficientFunds.toSorted(compareEarnByAmountDesc(getAccountBalanceInFiat)),
        ],
        [
            accountsStakingActive,
            accountsSufficientFunds,
            getAccountStakedAmountInFiat,
            getAccountBalanceInFiat,
        ],
    );

    const collapsedInsufficientFundsAccounts = useMemo(() => {
        const hasEthBaseAccount = alwaysVisibleAccounts.some(account => account.symbol === 'eth');
        const hasSolBaseAccount = alwaysVisibleAccounts.some(account => account.symbol === 'sol');
        const hasAdaBaseAccount = alwaysVisibleAccounts.some(account => account.symbol === 'ada');
        const hasTrxBaseAccount = alwaysVisibleAccounts.some(account => account.symbol === 'trx');

        const sortedInsufficientFundsAccounts = sortByCoin([...accountsInsufficientFunds]);

        const additionalAccounts: Account[] = [];

        if (!hasEthBaseAccount && !ethNotActivated) {
            const account = sortedInsufficientFundsAccounts.find(
                insufficientAccount => insufficientAccount.symbol === 'eth',
            );

            if (account) additionalAccounts.push(account);
        }

        if (!hasSolBaseAccount && !solNotActivated) {
            const account = sortedInsufficientFundsAccounts.find(
                insufficientAccount => insufficientAccount.symbol === 'sol',
            );

            if (account) additionalAccounts.push(account);
        }

        if (!hasAdaBaseAccount && !adaNotActivated) {
            const account = sortedInsufficientFundsAccounts.find(
                insufficientAccount => insufficientAccount.symbol === 'ada',
            );

            if (account) additionalAccounts.push(account);
        }

        if (!hasTrxBaseAccount && !trxNotActivated) {
            const account = sortedInsufficientFundsAccounts.find(
                account => account.symbol === 'trx',
            );

            if (account) additionalAccounts.push(account);
        }

        return sortByCoin([...additionalAccounts]);
    }, [
        alwaysVisibleAccounts,
        accountsInsufficientFunds,
        ethNotActivated,
        solNotActivated,
        adaNotActivated,
        trxNotActivated,
    ]);

    const collapsedAccounts = [...alwaysVisibleAccounts, ...collapsedInsufficientFundsAccounts];

    const expandedAccounts = [
        ...alwaysVisibleAccounts,
        ...sortByCoin([...accountsInsufficientFunds]),
    ];

    const displayedAccounts = isExpanded ? expandedAccounts : collapsedAccounts;
    const isExpandable = collapsedAccounts.length !== expandedAccounts.length;

    const hasAnyRewardsData =
        accountsStakingActive.length > 0 || accountsSufficientFunds.length > 0;

    return { displayedAccounts, isExpanded, toggleExpanded, isExpandable, hasAnyRewardsData };
};
