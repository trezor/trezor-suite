import { useState } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { type TokensRootState, selectAccountDefiTokensCount } from '@suite-common/wallet-core';
import { type NativeAccountsRootState, selectAccountListSections } from '@suite-native/accounts';
import { type RootStackParamList, type RootStackRoutes, Screen } from '@suite-native/navigation';

import { AccountAssetsScreenHeader } from '../components/AccountAssets/AccountAssetsScreenHeader';
import {
    type AccountAssetsTab,
    AccountAssetsTabBar,
} from '../components/AccountAssets/AccountAssetsTabBar';
import { AccountAssetsTabContent } from '../components/AccountAssets/AccountAssetsTabContent';

export const AccountAssetsScreen = () => {
    const { params } = useRoute<RouteProp<RootStackParamList, RootStackRoutes.AccountAssets>>();
    const { accountKey } = params;

    const [activeTab, setActiveTab] = useState<AccountAssetsTab>('tokens');

    const sections = useSelector((state: NativeAccountsRootState) =>
        selectAccountListSections(state, accountKey),
    );
    const defiTokenCount = useSelector((state: TokensRootState) =>
        selectAccountDefiTokensCount(state, accountKey),
    );

    const tokenCount = sections.filter(item => item.type === 'token').length;

    return (
        <Screen header={<AccountAssetsScreenHeader accountKey={accountKey} />}>
            <AccountAssetsTabBar
                activeTab={activeTab}
                tokenCount={tokenCount}
                defiTokenCount={defiTokenCount}
                onTabChange={setActiveTab}
            />
            <AccountAssetsTabContent accountKey={accountKey} activeTab={activeTab} />
        </Screen>
    );
};
