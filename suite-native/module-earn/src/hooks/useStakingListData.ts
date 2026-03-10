import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { PROD_STAKING_SYMBOLS, STAKING_SYMBOLS } from '@suite-common/wallet-config';
import { selectDeviceAccounts, selectVisibleDeviceAccounts } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import {
    getAccountTotalStakingBalance,
    isCardanoStakedWithFiveBinaries,
    isStakingSymbol,
} from '@suite-common/wallet-utils';
import { selectAreTestnetsEnabled } from '@suite-native/settings';

import { type EarnPromoListDataItem, type StakingEarnItem } from '../types';

type UseStakingListDataReturn = {
    activeItems: StakingEarnItem[];
    promoListData: EarnPromoListDataItem[];
    accountStakedWithFiveBinaries: Account | undefined;
};

export const useStakingListData = () => {
    const visibleAccounts = useSelector(selectVisibleDeviceAccounts);
    const allAccounts = useSelector(selectDeviceAccounts);
    const areTestnetsEnabled = useSelector(selectAreTestnetsEnabled);
    const stakingSymbols = areTestnetsEnabled ? STAKING_SYMBOLS : PROD_STAKING_SYMBOLS;

    return useMemo<UseStakingListDataReturn>(() => {
        const stakingAccounts = visibleAccounts.filter(acc => isStakingSymbol(acc.symbol));
        const allStakingAccounts = allAccounts.filter(acc => isStakingSymbol(acc.symbol));

        const accountStakedWithFiveBinaries = stakingAccounts.find(
            account => account.visible && isCardanoStakedWithFiveBinaries(account),
        );

        const activeItems: StakingEarnItem[] = [];
        const promoItems: StakingEarnItem[] = [];

        stakingSymbols.forEach(symbol => {
            let stakingAccountKey: string | null = null;
            let stakingAccountLabel = '';

            allStakingAccounts.forEach(account => {
                if (account.symbol !== symbol) {
                    return;
                }

                const stakedAmount = getAccountTotalStakingBalance(account);

                if (stakedAmount === null || stakedAmount === '0') {
                    if (stakingAccountKey === null) {
                        stakingAccountKey = account.key;
                        stakingAccountLabel = account.accountLabel ?? '';
                    }

                    return;
                }

                if (account.visible) {
                    activeItems.push({
                        id: `${symbol}-${account.key}`,
                        type: 'staking',
                        symbol,
                        accountKey: account.key,
                        accountLabel: account.accountLabel,
                        balance: stakedAmount,
                    });
                }

                stakingAccountKey = account.key;
                stakingAccountLabel = account.accountLabel ?? '';
            });

            promoItems.push({
                id: symbol,
                type: 'staking',
                symbol,
                accountKey: stakingAccountKey,
                accountLabel: stakingAccountLabel,
                balance: null,
            });
        });

        const promoListData: EarnPromoListDataItem[] = ['staking', ...promoItems];

        return {
            activeItems,
            promoListData,
            accountStakedWithFiveBinaries,
        };
    }, [visibleAccounts, allAccounts, stakingSymbols]);
};
