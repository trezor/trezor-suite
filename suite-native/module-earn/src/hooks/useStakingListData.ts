import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { PROD_STAKING_SYMBOLS } from '@suite-common/wallet-config';
import { selectVisibleDeviceAccounts } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import {
    getAccountTotalStakingBalance,
    isCardanoStakedWithFiveBinaries,
    isStakingSymbol,
} from '@suite-common/wallet-utils';

import { type EarnPromoListDataItem, type StakingEarnItem } from '../types';

type UseStakingListDataReturn = {
    activeItems: StakingEarnItem[];
    promoListData: EarnPromoListDataItem[];
    accountStakedWithFiveBinaries: Account | undefined;
};

export const useStakingListData = () => {
    const accounts = useSelector(selectVisibleDeviceAccounts);

    return useMemo<UseStakingListDataReturn>(() => {
        const stakingAccounts = accounts.filter(acc => isStakingSymbol(acc.symbol));

        const accountStakedWithFiveBinaries = stakingAccounts.find(
            account => account.visible && isCardanoStakedWithFiveBinaries(account),
        );

        const activeItems: StakingEarnItem[] = [];
        const promoItems: StakingEarnItem[] = [];

        PROD_STAKING_SYMBOLS.forEach(symbol => {
            promoItems.push({
                id: symbol,
                type: 'staking',
                symbol,
                accountKey: null,
                accountLabel: '',
                balance: null,
            });

            stakingAccounts.forEach(account => {
                if (account.symbol !== symbol) {
                    return;
                }

                const stakedAmount = getAccountTotalStakingBalance(account);

                if (stakedAmount === null || stakedAmount === '0') {
                    return;
                }

                activeItems.push({
                    id: `${symbol}-${account.key}`,
                    type: 'staking',
                    symbol,
                    accountKey: account.key,
                    accountLabel: account.accountLabel,
                    balance: stakedAmount,
                });
            });
        });

        const promoListData: EarnPromoListDataItem[] = ['staking', ...promoItems];

        return {
            activeItems,
            promoListData,
            accountStakedWithFiveBinaries,
        };
    }, [accounts]);
};
