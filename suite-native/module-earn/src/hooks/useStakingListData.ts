import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { PROD_STAKING_SYMBOLS, STAKING_SYMBOLS } from '@suite-common/wallet-config';
import { selectVisibleDeviceAccounts } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import {
    getAccountTotalStakingBalance,
    isCardanoStakedWithFiveBinaries,
    isStakingSymbol,
} from '@suite-common/wallet-utils';
import { selectAreTestnetsEnabled } from '@suite-native/settings';

import {
    type EarnPromoListDataItem,
    type EarnProviderListItem,
    type StakingEarnItem,
} from '../types';

export const EVERSTAKE_PROVIDER_LIST_ITEM = {
    id: 'everstake-provider',
    type: 'provider',
} as const satisfies EarnProviderListItem;

type UseStakingListDataReturn = {
    activeItems: StakingEarnItem[];
    promoListData: EarnPromoListDataItem[];
    accountStakedWithFiveBinaries: Account | undefined;
};

export const useStakingListData = () => {
    const accounts = useSelector(selectVisibleDeviceAccounts);
    const areTestnetsEnabled = useSelector(selectAreTestnetsEnabled);

    return useMemo<UseStakingListDataReturn>(() => {
        const stakingAccounts = accounts.filter(acc => isStakingSymbol(acc.symbol));
        const stakingSymbols = areTestnetsEnabled ? STAKING_SYMBOLS : PROD_STAKING_SYMBOLS;

        const accountStakedWithFiveBinaries = stakingAccounts.find(
            account => account.visible && isCardanoStakedWithFiveBinaries(account),
        );

        const activeItems: StakingEarnItem[] = [];
        const promoItems: StakingEarnItem[] = [];

        stakingSymbols.forEach(symbol => {
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
    }, [accounts, areTestnetsEnabled]);
};
