import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { isCardanoStakedWithFiveBinaries } from '@suite-common/staking';
import { PROD_STAKING_SYMBOLS, STAKING_SYMBOLS } from '@suite-common/wallet-config';
import { selectVisibleDeviceAccounts } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import {
    getAccountTotalStakingBalance,
    isStakingSymbol,
    sortByCoin,
} from '@suite-common/wallet-utils';
import { selectAreTestnetsEnabled } from '@suite-native/settings';

import {
    type EarnPromoListDataItem,
    type EarnStakingProvidersInfoListItem,
    type StakingEarnItem,
} from '../../types';
import { hasAccountActiveStaking } from '../../utils/staking/hasAccountActiveStaking';

export const STAKING_PROVIDERS_INFO_LIST_ITEM = {
    id: 'staking-providers-info',
    type: 'staking-providers-info',
} as const satisfies EarnStakingProvidersInfoListItem;

type UseStakingListDataReturn = {
    activeItems: StakingEarnItem[];
    promoListData: EarnPromoListDataItem[];
    accountStakedWithFiveBinaries: Account | undefined;
};

export const useStakingListData = () => {
    const accounts = useSelector(selectVisibleDeviceAccounts);
    const areTestnetsEnabled = useSelector(selectAreTestnetsEnabled);

    return useMemo<UseStakingListDataReturn>(() => {
        const stakingAccounts = sortByCoin(accounts.filter(acc => isStakingSymbol(acc.symbol)));
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

                if (!hasAccountActiveStaking(account)) {
                    return;
                }

                const stakedAmount = getAccountTotalStakingBalance(account) ?? '0';

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

        const promoListData: EarnPromoListDataItem[] = [
            'staking',
            ...promoItems,
            STAKING_PROVIDERS_INFO_LIST_ITEM,
        ];

        return {
            activeItems,
            promoListData,
            accountStakedWithFiveBinaries,
        };
    }, [accounts, areTestnetsEnabled]);
};
