import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { ExperimentId, useIsExperimentVariantActive } from '@suite-common/message-system';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { events, injectNativeAnalytics } from '@suite-native/analytics';
import { Box, useScrollDivider } from '@suite-native/atoms';
import {
    AccountDetailStackRoutes,
    AssetsStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    SendStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';
import { exhaustive } from '@trezor/type-utils';

import { ActiveTokensTab } from './ActiveTokensTab';
import { DefiTokensTab } from './DefiTokensTab';
import { HiddenTokensTab } from './HiddenTokensTab';
import { InactiveTokensTab } from './InactiveTokensTab';
import {
    type AccountAssetsTabListProps,
    type AccountOverviewFlow,
    type AccountOverviewTab,
    type OnScroll,
    type OnSelectAsset,
} from './types';

type AccountOverviewTabContentProps = AccountAssetsTabListProps & {
    accountKey: AccountKey;
    activeTab: AccountOverviewTab;
    flowType: AccountOverviewFlow;
};

type ActiveTabProps = AccountAssetsTabListProps & {
    accountKey: AccountKey;
    activeTab: AccountOverviewTab;
    flowType: AccountOverviewFlow;
    onSelect: OnSelectAsset;
};

const TokensTab = ({
    accountKey,
    activeTab,
    flowType,
    ListHeaderComponent,
    onSelect,
    onScroll,
}: ActiveTabProps & { onScroll: OnScroll }) => {
    switch (activeTab) {
        case 'tokens':
            return (
                <ActiveTokensTab
                    accountKey={accountKey}
                    onSelect={onSelect}
                    isStakingDisplayed={flowType === 'overview'}
                    ListHeaderComponent={ListHeaderComponent}
                    onScroll={onScroll}
                />
            );
        case 'defi':
            return (
                <DefiTokensTab
                    accountKey={accountKey}
                    onSelect={onSelect}
                    ListHeaderComponent={ListHeaderComponent}
                    onScroll={onScroll}
                />
            );
        case 'hidden':
            return (
                <HiddenTokensTab
                    accountKey={accountKey}
                    onSelect={onSelect}
                    ListHeaderComponent={ListHeaderComponent}
                    onScroll={onScroll}
                />
            );
        case 'inactive':
            return (
                <InactiveTokensTab
                    accountKey={accountKey}
                    ListHeaderComponent={ListHeaderComponent}
                    onScroll={onScroll}
                />
            );
        default:
            return exhaustive(activeTab);
    }
};

const ActiveTab = (props: ActiveTabProps) => {
    const { scrollDivider, handleScroll } = useScrollDivider();

    return (
        <Box flex={1}>
            {scrollDivider}
            <TokensTab {...props} onScroll={handleScroll} />
        </Box>
    );
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

    return (
        <ActiveTab
            key={activeTab}
            accountKey={accountKey}
            activeTab={activeTab}
            flowType={flowType}
            ListHeaderComponent={ListHeaderComponent}
            onSelect={handleSelect}
        />
    );
};
