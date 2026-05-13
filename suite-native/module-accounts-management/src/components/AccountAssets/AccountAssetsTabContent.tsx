import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { events } from '@suite-native/analytics';
import {
    type RootStackParamList,
    RootStackRoutes,
    SendStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';
import { exhaustive } from '@trezor/type-utils';

import { ActiveTokensTab } from './ActiveTokensTab';
import { DefiTokensTab } from './DefiTokensTab';
import { HiddenTokensTab } from './HiddenTokensTab';
import { InactiveTokensTab } from './InactiveTokensTab';
import { type AccountAssetsFlow, type AccountAssetsTab, type OnSelectAsset } from './types';

type AccountAssetsTabContentProps = {
    accountKey: AccountKey;
    activeTab: AccountAssetsTab;
    flowType: AccountAssetsFlow;
};

export const AccountAssetsTabContent = ({
    accountKey,
    activeTab,
    flowType,
}: AccountAssetsTabContentProps) => {
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.AccountAssets>>();
    const analytics = useAnalytics();
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
                navigation.navigate(RootStackRoutes.AccountDetail, {
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
