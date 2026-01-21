import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { PROD_STAKING_SYMBOLS } from '@suite-common/wallet-config';
import { selectVisibleDeviceAccounts } from '@suite-common/wallet-core';
import {
    getAccountTotalStakingBalance,
    isCardanoStakedWithFiveBinaries,
    isStakingSymbol,
} from '@suite-common/wallet-utils';

import { EarnItem } from '../types';

export const useStakingListData = () => {
    const accounts = useSelector(selectVisibleDeviceAccounts);

    return useMemo(() => {
        const stakingAccounts = accounts.filter(acc => isStakingSymbol(acc.symbol));

        const accountStakedWithFiveBinaries = stakingAccounts.find(
            account => account.visible && isCardanoStakedWithFiveBinaries(account),
        );

        const stakingData: EarnItem[] = PROD_STAKING_SYMBOLS.flatMap(symbol => {
            const accs = stakingAccounts.filter(acc => acc.symbol === symbol);
            const accountsStakingActive = accs.flatMap(acc => {
                const stakedAmount = getAccountTotalStakingBalance(acc);

                // return user's accounts with active accounts if has any
                if (stakedAmount !== null && stakedAmount !== '0') {
                    return {
                        symbol,
                        accountKey: acc.key,
                        accountLabel: acc.accountLabel,
                    };
                }

                return [];
            });

            // if not return fallback value
            if (accountsStakingActive.length === 0) {
                return { symbol, accountKey: '', accountLabel: '' };
            }

            return accountsStakingActive;
        });

        const listData = ['Staking', ...stakingData];

        return { listData, accountStakedWithFiveBinaries };
    }, [accounts]);
};
