import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { ExperimentId, useIsExperimentVariantActive } from '@suite-common/message-system';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { events, injectNativeAnalytics } from '@suite-native/analytics';
import {
    AccountDetailStackRoutes,
    AssetsStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    SendStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { exhaustive } from '@trezor/type-utils';

import { ActiveTokensTab } from './ActiveTokensTab';
import { DefiTokensTab } from './DefiTokensTab';
import { HiddenTokensTab } from './HiddenTokensTab';
import { InactiveTokensTab } from './InactiveTokensTab';
import {
    type AccountOverviewFlow,
    type AccountOverviewTab,
    type AccountAssetsTabListProps,
    type OnSelectAsset,
} from './types';

type AccountOverviewTabContentProps = AccountAssetsTabListProps & {
    accountKey: AccountKey;
    activeTab: AccountOverviewTab;
    flowType: AccountOverviewFlow;
};

export const AccountOverviewTabContent = ({
    accountKey,
    activeTab,
    flowType,
    ListHeaderComponent,
}: AccountOverviewTabContentProps) => {
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.AccountOverview>>();
    const { analytics } = useServices(injectNativeAnalytics);
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const isAssetDetailFeatureEnabled = useIsExperimentVariantActive({
        experimentId: ExperimentId.assetFirstHomeTable,
        variant: 'B',
    });

    const handleSelect = useCallback<OnSelectAsset>(
        ({ tokenContract, tokenSymbol }) => {
            if (flowType === 'send') {
                if (!account) return;
                analytics.report({
                    type: events.sendFlowEnteredEvent.name,
                    payload: {
                        location: 'dashboard',
                        assetSymbol: account.symbol,
                        tokenContract,
                        tokenSymbol,
                    },
                });
                navigation.navigate(RootStackRoutes.SendStack, {
                    screen: SendStackRoutes.SendOutputs,
                    params: { accountKey, tokenContract },
                });
            } else if (isAssetDetailFeatureEnabled && account) {
                navigation.navigate(RootStackRoutes.AssetsStack, {
                    screen: AssetsStackRoutes.AssetDetail,
                    params: {
                        networkSymbol: account.symbol,
                        tokenContract,
                    },
                });
            } else {
                navigation.navigate(RootStackRoutes.AccountDetailStack, {
                    screen: AccountDetailStackRoutes.AccountDetail,
                    params: {
                        accountKey,
                        tokenContract,
                        closeActionType: 'back',
                    },
                });
            }
        },
        [flowType, isAssetDetailFeatureEnabled, account, accountKey, analytics, navigation],
    );

    switch (activeTab) {
        case 'tokens':
            return (
                <ActiveTokensTab
                    accountKey={accountKey}
                    onSelect={handleSelect}
                    isStakingDisplayed={flowType === 'overview'}
                    ListHeaderComponent={ListHeaderComponent}
                />
            );
        case 'defi':
            return (
                <DefiTokensTab
                    accountKey={accountKey}
                    onSelect={handleSelect}
                    ListHeaderComponent={ListHeaderComponent}
                />
            );
        case 'hidden':
            return (
                <HiddenTokensTab
                    accountKey={accountKey}
                    onSelect={handleSelect}
                    ListHeaderComponent={ListHeaderComponent}
                />
            );
        case 'inactive':
            return (
                <InactiveTokensTab
                    accountKey={accountKey}
                    ListHeaderComponent={ListHeaderComponent}
                />
            );
        default:
            return exhaustive(activeTab);
    }
};
