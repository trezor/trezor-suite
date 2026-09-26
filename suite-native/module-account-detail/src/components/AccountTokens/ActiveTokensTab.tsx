import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { FlashList } from '@shopify/flash-list';

import { type AccountKey } from '@suite-common/wallet-types';
import {
    AccountsListItem,
    AccountsListStakingItem,
    AccountsListTokenItem,
    type NativeAccountsRootState,
    type OnSelectAccount,
    selectAccountListSectionsWithZeroBalanceGroup,
} from '@suite-native/accounts';
import {
    StakingApyBadge,
    TokenYieldRateBadge,
    useStakingDetailNavigation,
} from '@suite-native/module-earn';

import { ZeroBalanceTokensSection } from './ZeroBalanceTokensSection';
import { type OnSelectAsset } from './types';

type ActiveTokensTabProps = {
    accountKey: AccountKey;
    onSelect: OnSelectAsset;
    isStakingDisplayed: boolean;
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
}: ActiveTokensTabProps) => {
    const { navigateToStakingDetail } = useStakingDetailNavigation();

    const activeTokensSections = useSelector((state: NativeAccountsRootState) =>
        selectAccountListSectionsWithZeroBalanceGroup(state, accountKey),
    );

    const handleSelectAccount: OnSelectAccount = useCallback(
        ({ account, tokenAddress, tokenSymbol, isStaking }) => {
            if (isStaking) {
                navigateToStakingDetail({ accountKey: account.key, symbol: account.symbol });

                return;
            }
            onSelect({ tokenContract: tokenAddress, tokenSymbol });
        },
        [onSelect, navigateToStakingDetail],
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
            data={listItems}
            keyExtractor={getItemKey}
            getItemType={item => item.type}
            renderItem={renderItem}
        />
    );
};
