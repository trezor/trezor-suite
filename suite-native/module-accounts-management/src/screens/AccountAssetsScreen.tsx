import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { type NativeStackScreenProps } from '@react-navigation/native-stack';

import {
    type AccountsRootState,
    type TokensRootState,
    selectAccountByKey,
    selectAccountDefiTokensCount,
    selectAccountManuallyHiddenTokensCount,
} from '@suite-common/wallet-core';
import { isAccountFailed } from '@suite-common/wallet-utils';
import {
    type NativeAccountsRootState,
    selectAccountListSectionsWithZeroBalanceGroup,
    useResolvedAccountKey,
} from '@suite-native/accounts';
import { VStack } from '@suite-native/atoms';
import { type RootStackParamList, type RootStackRoutes, Screen } from '@suite-native/navigation';

import { AccountAssetsScreenHeader } from '../components/AccountAssets/AccountAssetsScreenHeader';
import { AccountAssetsTabBar } from '../components/AccountAssets/AccountAssetsTabBar';
import { AccountAssetsTabContent } from '../components/AccountAssets/AccountAssetsTabContent';
import { AccountEarnPromoBanner } from '../components/AccountAssets/AccountEarnPromoBanner';
import { type AccountAssetsTab } from '../components/AccountAssets/types';
import { AccountDiscoveryFailedBanner } from '../components/AccountBanners/AccountDiscoveryFailedBanner';

export const AccountAssetsScreen = ({
    route: {
        params: {
            accountKey: routeAccountKey,
            tab,
            flowType = 'assets',
            networkSymbol,
            accountType,
            accountIndex,
        },
    },
    navigation,
}: NativeStackScreenProps<RootStackParamList, RootStackRoutes.AccountAssets>) => {
    const [activeTab, setActiveTab] = useState<AccountAssetsTab>(tab ?? 'tokens');

    useEffect(() => {
        if (tab !== undefined) {
            setActiveTab(tab);
        }
    }, [tab]);

    const accountKey =
        useResolvedAccountKey({
            accountKey: routeAccountKey,
            networkSymbol,
            accountType,
            accountIndex,
            setParams: navigation.setParams,
        }) ?? routeAccountKey;

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
    const isFailed = !!account && isAccountFailed(account);

    return (
        <Screen header={<AccountAssetsScreenHeader accountKey={accountKey} flowType={flowType} />}>
            {isFailed ? (
                <AccountDiscoveryFailedBanner accountKey={accountKey} />
            ) : (
                <VStack spacing="sp16">
                    <AccountEarnPromoBanner account={account} />

                    <AccountAssetsTabBar
                        activeTab={activeTab}
                        flowType={flowType}
                        networkType={account?.networkType}
                        tokenCount={tokenCount}
                        defiTokenCount={defiTokenCount}
                        hiddenTokenCount={manuallyHiddenTokens}
                        onTabChange={setActiveTab}
                    />
                    <AccountAssetsTabContent
                        accountKey={accountKey}
                        activeTab={activeTab}
                        flowType={flowType}
                    />
                </VStack>
            )}
        </Screen>
    );
};
