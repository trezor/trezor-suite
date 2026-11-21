import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';

import { useSelector } from '#src/hooks/suite/useSelector';

import { useStakingAccountsVisibility } from './useStakingAccountsVisibility';
import {
    selectEarnStakingActivateSymbols,
    selectEarnStakingAvailableCount,
    selectEarnStakingStakeableAccounts,
    selectEarnStakingStakedAccounts,
    selectEarnStakingUnderfundedAccounts,
} from '../earnStakingTableSelectors';

type UseStakingTableDataResult = {
    displayedAccounts: Account[];
    activateSymbols: readonly NetworkSymbol[];
    isExpandable: boolean;
    isExpanded: boolean;
    toggleExpanded: () => void;
    hasAnyRewardsData: boolean;
    hasStakingPosition: boolean;
    availableStakingCount: number;
};

export const useStakingTableData = (): UseStakingTableDataResult => {
    const stakedAccounts = useSelector(selectEarnStakingStakedAccounts);
    const stakeableAccounts = useSelector(selectEarnStakingStakeableAccounts);
    const underfundedAccounts = useSelector(selectEarnStakingUnderfundedAccounts);
    const activateSymbols = useSelector(selectEarnStakingActivateSymbols);
    const availableStakingCount = useSelector(selectEarnStakingAvailableCount);

    const visibility = useStakingAccountsVisibility({
        stakedAccounts,
        stakeableAccounts,
        underfundedAccounts,
    });

    return {
        ...visibility,
        activateSymbols,
        hasStakingPosition: stakedAccounts.length > 0,
        availableStakingCount,
    };
};
