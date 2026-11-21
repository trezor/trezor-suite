import { useState } from 'react';

import { selectSupportedNetworkSymbols } from '@suite-common/networks';
import { type Account } from '@suite-common/wallet-types';
import { compareEarnByAmountDesc, sortByCoin } from '@suite-common/wallet-utils';

import { useSelector } from '#src/hooks/suite/useSelector';

import { selectEarnStakingFiatAmountsByAccountKey } from '../earnStakingTableSelectors';

type UseStakingAccountsVisibilityParams = {
    stakedAccounts: readonly Account[];
    stakeableAccounts: readonly Account[];
    underfundedAccounts: readonly Account[];
};

export const useStakingAccountsVisibility = ({
    stakedAccounts,
    stakeableAccounts,
    underfundedAccounts,
}: UseStakingAccountsVisibilityParams) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const supportedNetworks = useSelector(selectSupportedNetworkSymbols);
    const fiatAmounts = useSelector(selectEarnStakingFiatAmountsByAccountKey);

    const toggleExpanded = () => {
        setIsExpanded(previous => !previous);
    };

    const byFiatAmountDesc = compareEarnByAmountDesc(
        (account: Account) => fiatAmounts[account.key] ?? '0',
    );

    const alwaysVisibleAccounts = [
        ...stakedAccounts.toSorted(byFiatAmountDesc),
        ...stakeableAccounts.toSorted(byFiatAmountDesc),
    ];

    const underfundedInNetworkOrder = sortByCoin([...underfundedAccounts], supportedNetworks);

    // One underfunded account stands for a network that has no other row, so every network with
    // an account shows up while the table is collapsed.
    const collapsedUnderfundedAccounts = underfundedInNetworkOrder.filter(
        (account, index, accounts) =>
            !alwaysVisibleAccounts.some(visible => visible.symbol === account.symbol) &&
            accounts.findIndex(other => other.symbol === account.symbol) === index,
    );

    const collapsedAccounts = [...alwaysVisibleAccounts, ...collapsedUnderfundedAccounts];
    const expandedAccounts = [...alwaysVisibleAccounts, ...underfundedInNetworkOrder];

    return {
        displayedAccounts: isExpanded ? expandedAccounts : collapsedAccounts,
        isExpanded,
        toggleExpanded,
        isExpandable: collapsedAccounts.length !== expandedAccounts.length,
        hasAnyRewardsData: stakedAccounts.length > 0 || stakeableAccounts.length > 0,
    };
};
