import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import {
    type AccountsRootState,
    type TokensRootState,
    selectAccountByKey,
    selectAccountDefiTokensCount,
    selectAccountManuallyHiddenTokensCount,
} from '@suite-common/wallet-core';
import {
    type NativeAccountsRootState,
    selectAccountListSectionsWithZeroBalanceGroup,
} from '@suite-native/accounts';
import { VStack } from '@suite-native/atoms';
import { type RootStackParamList, type RootStackRoutes, Screen } from '@suite-native/navigation';

import { AccountAssetsScreenHeader } from '../components/AccountAssets/AccountAssetsScreenHeader';
import { AccountAssetsTabBar } from '../components/AccountAssets/AccountAssetsTabBar';
import { AccountAssetsTabContent } from '../components/AccountAssets/AccountAssetsTabContent';
import { type AccountAssetsTab } from '../components/AccountAssets/types';

export const AccountAssetsScreen = () => {
    const { params } = useRoute<RouteProp<RootStackParamList, RootStackRoutes.AccountAssets>>();
    const { accountKey, tab } = params;

    const [activeTab, setActiveTab] = useState<AccountAssetsTab>(tab ?? 'tokens');

    useEffect(() => {
        if (tab !== undefined) {
            setActiveTab(tab);
        }
    }, [tab]);

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const sections = useSelector((state: NativeAccountsRootState) =>
        selectAccountListSectionsWithZeroBalanceGroup(state, accountKey),
    );
    const defiTokenCount = useSelector((state: TokensRootState) =>
        selectAccountDefiTokensCount(state, accountKey),
    );
    const manuallyHiddenTokens = useSelector((state: TokensRootState) =>
        selectAccountManuallyHiddenTokensCount(state, accountKey),
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
                    hiddenTokenCount={manuallyHiddenTokens}
                    showInactiveTab={showInactiveTab ?? false}
                    onTabChange={setActiveTab}
                />
                <AccountAssetsTabContent accountKey={accountKey} activeTab={activeTab} />
            </VStack>
        </Screen>
    );
};
