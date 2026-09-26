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
    AccountDiscoveryFailedBanner,
    type NativeAccountsRootState,
    selectAccountListSectionsWithZeroBalanceGroup,
    useResolvedAccountKey,
} from '@suite-native/accounts';
import { VStack } from '@suite-native/atoms';
import {
    type AccountDetailStackParamList,
    type AccountDetailStackRoutes,
    Screen,
} from '@suite-native/navigation';

import { AccountEarnPromoBanner } from '../components/AccountTokens/AccountEarnPromoBanner';
import { AccountTokensScreenHeader } from '../components/AccountTokens/AccountTokensScreenHeader';
import { AccountTokensTabBar } from '../components/AccountTokens/AccountTokensTabBar';
import { AccountTokensTabContent } from '../components/AccountTokens/AccountTokensTabContent';
import { type AccountTokensTab } from '../components/AccountTokens/types';

export const AccountTokensScreen = ({
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
}: NativeStackScreenProps<AccountDetailStackParamList, AccountDetailStackRoutes.AccountTokens>) => {
    const [activeTab, setActiveTab] = useState<AccountTokensTab>(tab ?? 'tokens');

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
        <Screen header={<AccountTokensScreenHeader accountKey={accountKey} flowType={flowType} />}>
            {isFailed ? (
                <AccountDiscoveryFailedBanner accountKey={accountKey} />
            ) : (
                <VStack spacing="sp16">
                    <AccountEarnPromoBanner account={account} />

                    <AccountTokensTabBar
                        activeTab={activeTab}
                        flowType={flowType}
                        networkType={account?.networkType}
                        tokenCount={tokenCount}
                        defiTokenCount={defiTokenCount}
                        hiddenTokenCount={manuallyHiddenTokens}
                        onTabChange={setActiveTab}
                    />
                    <AccountTokensTabContent
                        accountKey={accountKey}
                        activeTab={activeTab}
                        flowType={flowType}
                    />
                </VStack>
            )}
        </Screen>
    );
};
