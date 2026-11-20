import { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';

import { type AccountsRootState, selectAccountNetworkType } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import {
    AccountsListItem,
    AccountsListStakingItem,
    AccountsListTokenItem,
    type NativeAccountsRootState,
    type OnSelectAccount,
    selectAccountListSectionsWithZeroBalanceGroup,
} from '@suite-native/accounts';
import { Button } from '@suite-native/atoms';
import {
    StakingApyBadge,
    TokenYieldRateBadge,
    useStakingDetailNavigation,
    useStakingNavigateAnalytics,
} from '@suite-native/earn';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { ZeroBalanceTokensSection } from './ZeroBalanceTokensSection';
import { type AccountAssetsTabListProps, type OnSelectAsset } from './types';
import { useAccountOverviewListContentStyle } from './useAccountOverviewListContentStyle';

const listStyle = prepareNativeStyle(() => ({
    flex: 1,
}));

const listFooterStyle = prepareNativeStyle(utils => ({
    paddingTop: utils.spacings.sp16,
}));

type ActiveTokensTabProps = AccountAssetsTabListProps & {
    accountKey: AccountKey;
    onSelect: OnSelectAsset;
    isStakingDisplayed: boolean;
    isAddTokenDisplayed: boolean;
};

type SectionItem = ReturnType<typeof selectAccountListSectionsWithZeroBalanceGroup>[number];
type ActiveTokenListItem = SectionItem & { isLast: boolean };

const getItemKey = (item: ActiveTokenListItem): string => {
    switch (item.type) {
        case 'account':
            return item.account.key;
        case 'staking':
            return `${item.account.key}-staking`;
        case 'token':
            return item.token.contract;
        case 'zeroBalance':
            return 'zero-balance';
    }
};

export const ActiveTokensTab = ({
    accountKey,
    onSelect,
    isStakingDisplayed,
    isAddTokenDisplayed,
    ListHeaderComponent,
    onScroll,
}: ActiveTokensTabProps) => {
    const { applyStyle } = useNativeStyles();
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.AccountOverview>>();
    const networkType = useSelector((state: AccountsRootState) =>
        selectAccountNetworkType(state, accountKey),
    );
    const listContentStyle = useAccountOverviewListContentStyle();
    const { navigateToStakingDetail } = useStakingDetailNavigation();
    const reportStakingNavigate = useStakingNavigateAnalytics();

    const activeTokensSections = useSelector((state: NativeAccountsRootState) =>
        selectAccountListSectionsWithZeroBalanceGroup(state, accountKey),
    );

    const handleSelectAccount: OnSelectAccount = useCallback(
        ({ account, tokenAddress, tokenSymbol, isStaking }) => {
            if (isStaking) {
                reportStakingNavigate(account, 'account/navigation');
                navigateToStakingDetail({ accountKey: account.key, symbol: account.symbol });

                return;
            }
            onSelect({ tokenContract: tokenAddress, tokenSymbol });
        },
        [onSelect, navigateToStakingDetail, reportStakingNavigate],
    );

    const listItems: ActiveTokenListItem[] = useMemo(
        () =>
            activeTokensSections
                .filter(item => item.type !== 'staking' || isStakingDisplayed)
                .map((item, index, arr) => ({ ...item, isLast: index === arr.length - 1 })),
        [activeTokensSections, isStakingDisplayed],
    );

    const renderItem = useCallback(
        ({ item }: { item: ActiveTokenListItem }) => {
            switch (item.type) {
                case 'account':
                    return (
                        <AccountsListItem
                            {...item}
                            isNativeCoinOnly
                            hasBackground
                            showDivider
                            onPress={handleSelectAccount}
                            badges={
                                <TokenYieldRateBadge account={item.account} variant="inactive" />
                            }
                        />
                    );
                case 'staking':
                    return (
                        <AccountsListStakingItem
                            {...item}
                            hasBackground
                            onPress={() =>
                                handleSelectAccount({
                                    account: item.account,
                                    isStaking: true,
                                    hasAnyKnownTokens: false,
                                })
                            }
                            badges={<StakingApyBadge account={item.account} />}
                        />
                    );
                case 'token':
                    return (
                        <AccountsListTokenItem
                            {...item}
                            hasBackground
                            badges={
                                <TokenYieldRateBadge
                                    account={item.account}
                                    token={item.token}
                                    variant="inactive"
                                />
                            }
                            onSelectAccount={() =>
                                handleSelectAccount({
                                    account: item.account,
                                    tokenAddress: item.token.contract,
                                    tokenSymbol: item.token.symbol,
                                    hasAnyKnownTokens: true,
                                })
                            }
                        />
                    );
                case 'zeroBalance':
                    return (
                        <ZeroBalanceTokensSection
                            tokens={item.tokens}
                            account={item.account}
                            onSelect={onSelect}
                        />
                    );
            }
        },
        [handleSelectAccount, onSelect],
    );

    return (
        <FlashList
            style={applyStyle(listStyle)}
            contentContainerStyle={listContentStyle}
            data={listItems}
            keyExtractor={getItemKey}
            getItemType={item => item.type}
            renderItem={renderItem}
            ListHeaderComponent={ListHeaderComponent}
            ListFooterComponent={
                isAddTokenDisplayed && networkType === 'ethereum' ? (
                    <View style={applyStyle(listFooterStyle)}>
                        <Button
                            intent="neutral"
                            priority="secondary"
                            iconLeft="plus"
                            onPress={() =>
                                navigation.navigate(RootStackRoutes.AddCustomToken, { accountKey })
                            }
                            testID="@account-overview/add-custom-token-button"
                        >
                            <Translation id="moduleAccounts.addCustomToken.entryButton" />
                        </Button>
                    </View>
                ) : undefined
            }
            onScroll={onScroll}
        />
    );
};
