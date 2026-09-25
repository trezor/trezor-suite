import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { events, injectNativeAnalytics } from '@suite-native/analytics';
import {
    type AccountDetailStackParamList,
    AccountDetailStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    SendStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { exhaustive } from '@trezor/type-utils';

import { ActiveTokensTab } from './ActiveTokensTab';
import { DefiTokensTab } from './DefiTokensTab';
import { HiddenTokensTab } from './HiddenTokensTab';
import { InactiveTokensTab } from './InactiveTokensTab';
import { type AccountTokensFlow, type AccountTokensTab, type OnSelectAsset } from './types';

type AccountTokensTabContentProps = {
    accountKey: AccountKey;
    activeTab: AccountTokensTab;
    flowType: AccountTokensFlow;
};

export const AccountTokensTabContent = ({
    accountKey,
    activeTab,
    flowType,
}: AccountTokensTabContentProps) => {
    const navigation =
        useNavigation<
            StackToStackCompositeNavigationProps<
                AccountDetailStackParamList,
                AccountDetailStackRoutes.AccountTokens,
                RootStackParamList
            >
        >();
    const { analytics } = useServices(injectNativeAnalytics);
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

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
            } else {
                navigation.navigate(AccountDetailStackRoutes.AccountDetail, {
                    accountKey,
                    tokenContract,
                    closeActionType: 'back',
                });
            }
        },
        [flowType, account, accountKey, analytics, navigation],
    );

    switch (activeTab) {
        case 'tokens':
            return (
                <ActiveTokensTab
                    accountKey={accountKey}
                    onSelect={handleSelect}
                    isStakingDisplayed={flowType === 'assets'}
                />
            );
        case 'defi':
            return <DefiTokensTab accountKey={accountKey} onSelect={handleSelect} />;
        case 'hidden':
            return <HiddenTokensTab accountKey={accountKey} onSelect={handleSelect} />;
        case 'inactive':
            return <InactiveTokensTab accountKey={accountKey} />;
        default:
            return exhaustive(activeTab);
    }
};
