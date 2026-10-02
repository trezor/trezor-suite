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
import { type RootStackParamList, type RootStackRoutes, Screen } from '@suite-native/navigation';

import { AccountEarnPromoBanner } from '../components/AccountOverview/AccountEarnPromoBanner';
import { AccountOverviewScreenHeader } from '../components/AccountOverview/AccountOverviewScreenHeader';
import { AccountOverviewTabBar } from '../components/AccountOverview/AccountOverviewTabBar';
import { AccountOverviewTabContent } from '../components/AccountOverview/AccountOverviewTabContent';
import { type AccountOverviewTab } from '../components/AccountOverview/types';

type AccountOverviewScreenProps = NativeStackScreenProps<
    RootStackParamList,
    RootStackRoutes.AccountOverview
>;

export const AccountOverviewScreen = ({
    route: {
        params: {
            accountKey: routeAccountKey,
            tab,
            flowType = 'overview',
            networkSymbol,
            accountType,
            accountIndex,
        },
    },
    navigation,
}: AccountOverviewScreenProps) => {
    const [activeTab, setActiveTab] = useState<AccountOverviewTab>(tab ?? 'tokens');

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
        <Screen header={<AccountOverviewScreenHeader accountKey={accountKey} />}>
            {isFailed ? (
                <AccountDiscoveryFailedBanner accountKey={accountKey} />
            ) : (
                <VStack spacing="sp16">
                    <AccountEarnPromoBanner account={account} />

                    <AccountOverviewTabBar
                        activeTab={activeTab}
                        flowType={flowType}
                        networkType={account?.networkType}
                        tokenCount={tokenCount}
                        defiTokenCount={defiTokenCount}
                        hiddenTokenCount={manuallyHiddenTokens}
                        onTabChange={setActiveTab}
                    />
                    <AccountOverviewTabContent
                        accountKey={accountKey}
                        activeTab={activeTab}
                        flowType={flowType}
                    />
                </VStack>
            )}
        </Screen>
    );
};
