import { useServices } from '@suite-common/dependency-injection';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectNetworkConfigDeps, selectSupportedNetworkSymbols } from '@suite-common/networks';
import { getProdStakingSymbols, getStakingSymbols } from '@suite-common/wallet-config';
import {
    isCardanoStakedWithFiveBinaries,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
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
    const networkConfigDeps = useServices(selectNetworkConfigDeps);

    const supportedNetworks = useSelector(selectSupportedNetworkSymbols);
    const accounts = useSelector(selectVisibleDeviceAccounts);
    const areTestnetsEnabled = useSelector(selectAreTestnetsEnabled);

    return useMemo<UseStakingListDataReturn>(() => {
        const stakingAccounts = sortByCoin(
            networkConfigDeps,
            accounts.filter(acc => isStakingSymbol(networkConfigDeps, acc.symbol)),
            supportedNetworks,
        );
        const stakingSymbols = areTestnetsEnabled
            ? getStakingSymbols(networkConfigDeps)
            : getProdStakingSymbols(networkConfigDeps);

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

                if (!hasAccountActiveStaking(networkConfigDeps, account)) {
                    return;
                }

                const stakedAmount =
                    getAccountTotalStakingBalance(networkConfigDeps, account) ?? '0';

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
    }, [networkConfigDeps, accounts, areTestnetsEnabled, supportedNetworks]);
};
