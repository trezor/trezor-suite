import { useState } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import {
    type AccountsRootState,
    type TokensRootState,
    selectAccountByKey,
    selectAccountDefiTokensCount,
} from '@suite-common/wallet-core';
import { type NativeAccountsRootState, selectAccountListSections } from '@suite-native/accounts';
import { VStack } from '@suite-native/atoms';
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

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const sections = useSelector((state: NativeAccountsRootState) =>
        selectAccountListSections(state, accountKey),
    );
    const defiTokenCount = useSelector((state: TokensRootState) =>
        selectAccountDefiTokensCount(state, accountKey),
    );

    const tokenCount = sections.filter(item => item.type === 'token').length;
    const showInactiveTab = account?.networkType === 'stellar';

    return (
        <Screen header={<AccountAssetsScreenHeader accountKey={accountKey} />}>
            <VStack spacing="sp32">
                <AccountAssetsTabBar
                    activeTab={activeTab}
                    tokenCount={tokenCount}
                    defiTokenCount={defiTokenCount}
                    showInactiveTab={showInactiveTab ?? false}
                    onTabChange={setActiveTab}
                />
                <AccountAssetsTabContent accountKey={accountKey} activeTab={activeTab} />
            </VStack>
        </Screen>
    );
};
