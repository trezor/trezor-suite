import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';

import { type AccountKey } from '@suite-common/wallet-types';
import {
    AccountsListItem,
    AccountsListStakingItem,
    AccountsListTokenItem,
    type NativeAccountsRootState,
    type OnSelectAccount,
    selectActiveTokensTabSections,
} from '@suite-native/accounts';
import { useStakingDetailNavigation } from '@suite-native/module-earn';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

import { ZeroBalanceTokensSection } from './ZeroBalanceTokensSection';

type ActiveTokensTabProps = {
    accountKey: AccountKey;
};

type SectionItem = ReturnType<typeof selectActiveTokensTabSections>[number];
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

export const ActiveTokensTab = ({ accountKey }: ActiveTokensTabProps) => {
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.AccountAssets>>();
    const { navigateToStakingDetail } = useStakingDetailNavigation();

    const sections = useSelector((state: NativeAccountsRootState) =>
        selectActiveTokensTabSections(state, accountKey),
    );

    const handleSelectAccount: OnSelectAccount = useCallback(
        ({ account, tokenAddress, isStaking }) => {
            if (isStaking) {
                navigateToStakingDetail({ accountKey: account.key, symbol: account.symbol });

                return;
            }
            navigation.navigate(RootStackRoutes.AccountDetail, {
                accountKey: account.key,
                tokenContract: tokenAddress,
                closeActionType: 'back',
            });
        },
        [navigation, navigateToStakingDetail],
    );

    const listItems: ActiveTokenListItem[] = useMemo(
        () => sections.map((item, index, arr) => ({ ...item, isLast: index === arr.length - 1 })),
        [sections],
    );

    const renderItem = useCallback(
        ({ item }: { item: ActiveTokenListItem }) => {
            switch (item.type) {
                case 'account':
                    return (
                        <AccountsListItem
                            {...item}
                            hasBackground
                            showDivider
                            onPress={handleSelectAccount}
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
                        />
                    );
                case 'token':
                    return (
                        <AccountsListTokenItem
                            {...item}
                            hasBackground
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
                    return <ZeroBalanceTokensSection tokens={item.tokens} account={item.account} />;
            }
        },
        [handleSelectAccount],
    );

    return (
        <FlashList
            data={listItems}
            keyExtractor={getItemKey}
            getItemType={item => item.type}
            renderItem={renderItem}
        />
    );
};
