import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { FlashList } from '@shopify/flash-list';

import {
    type AccountsRootState,
    type TokensRootState,
    selectAccountByKey,
    selectAccountDefiTokens,
} from '@suite-common/wallet-core';
import { type AccountKey, type TokenInfoBranded } from '@suite-common/wallet-types';
import { AccountsListTokenItem } from '@suite-native/accounts';
import { Card, PictogramTitleHeader } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { TokenYieldRateBadge } from '@suite-native/module-earn';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { type AccountAssetsTabListProps, type OnSelectAsset } from './types';

const listStyle = prepareNativeStyle(() => ({
    flex: 1,
}));

const listContentStyle = prepareNativeStyle(({ spacings }) => ({
    paddingHorizontal: spacings.sp16,
}));

type DefiTokenListItem = {
    type: 'token';
    id: string;
    token: TokenInfoBranded;
    isFirst: boolean;
    isLast: boolean;
};

type DefiTokensTabProps = AccountAssetsTabListProps & {
    accountKey: AccountKey;
    onSelect: OnSelectAsset;
};

const DefiTokensEmptyState = () => (
    <Card>
        <PictogramTitleHeader
            variant="info"
            icon="coins"
            title={
                <Translation id="moduleAccountManagement.accountOverviewScreen.defiTokensSection.emptyTitle" />
            }
        />
    </Card>
);

export const DefiTokensTab = ({
    accountKey,
    onSelect,
    ListHeaderComponent,
    onScroll,
}: DefiTokensTabProps) => {
    const { applyStyle } = useNativeStyles();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const defiTokens = useSelector((state: TokensRootState) =>
        selectAccountDefiTokens(state, accountKey),
    );

    const listItems: DefiTokenListItem[] = useMemo(
        () =>
            defiTokens.map((token, index) => ({
                type: 'token' as const,
                id: token.contract,
                token,
                isFirst: index === 0,
                isLast: index === defiTokens.length - 1,
            })),
        [defiTokens],
    );

    const renderItem = useCallback(
        ({ item }: { item: DefiTokenListItem }) => {
            if (!account) {
                return null;
            }

            return (
                <AccountsListTokenItem
                    token={item.token}
                    account={account}
                    hasBackground
                    isFirst={item.isFirst}
                    isLast={item.isLast}
                    badges={
                        <TokenYieldRateBadge
                            account={account}
                            token={item.token}
                            variant="active"
                        />
                    }
                    onSelectAccount={() =>
                        onSelect({
                            tokenContract: item.token.contract,
                            tokenSymbol: item.token.symbol,
                        })
                    }
                />
            );
        },
        [account, onSelect],
    );

    return (
        <FlashList
            style={applyStyle(listStyle)}
            contentContainerStyle={applyStyle(listContentStyle)}
            data={listItems}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            ListHeaderComponent={ListHeaderComponent}
            ListEmptyComponent={<DefiTokensEmptyState />}
            onScroll={onScroll}
        />
    );
};
