import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { PROD_STAKING_SYMBOLS } from '@suite-common/wallet-config';
import { selectVisibleDeviceAccounts } from '@suite-common/wallet-core';
import {
    getAccountTotalStakingBalance,
    isCardanoStakedWithFiveBinaries,
    isStakingSymbol,
} from '@suite-common/wallet-utils';

import { StakingEarnItem } from '../types';

export const useStakingListData = () => {
    const accounts = useSelector(selectVisibleDeviceAccounts);

    return useMemo(() => {
        const stakingAccounts = accounts.filter(acc => isStakingSymbol(acc.symbol));

        const accountStakedWithFiveBinaries = stakingAccounts.find(
            account => account.visible && isCardanoStakedWithFiveBinaries(account),
        );

        const stakingData: StakingEarnItem[] = PROD_STAKING_SYMBOLS.flatMap(
            (symbol): StakingEarnItem[] => {
                const accs = stakingAccounts.filter(acc => acc.symbol === symbol);
                const accountsStakingActive = accs.flatMap(acc => {
                    const stakedAmount = getAccountTotalStakingBalance(acc);

                    // return user's accounts with active accounts if has any
                    if (stakedAmount !== null && stakedAmount !== '0') {
                        return {
                            type: 'staking',
                            symbol,
                            accountKey: acc.key,
                            accountLabel: acc.accountLabel,
                        } satisfies StakingEarnItem;
                    }

                    return [];
                });

                // if not return fallback value
                if (accountsStakingActive.length === 0) {
                    return [
                        {
                            type: 'staking',
                            symbol,
                            accountKey: null,
                            accountLabel: '',
                        } satisfies StakingEarnItem,
                    ];
                }

                return accountsStakingActive;
            },
        );

        const listData = ['Staking', ...stakingData];

        return { listData, accountStakedWithFiveBinaries };
    }, [accounts]);
};
