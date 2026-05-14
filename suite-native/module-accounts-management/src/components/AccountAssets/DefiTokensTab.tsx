import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';

import {
    type AccountsRootState,
    type TokensRootState,
    selectAccountByKey,
    selectAccountDefiTokens,
} from '@suite-common/wallet-core';
import { type AccountKey, type TokenInfoBranded } from '@suite-common/wallet-types';
import { AccountsListTokenItem } from '@suite-native/accounts';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

type DefiTokenListItem = {
    type: 'token';
    id: string;
    token: TokenInfoBranded;
    isFirst: boolean;
    isLast: boolean;
};

type DefiTokensTabProps = {
    accountKey: AccountKey;
};

export const DefiTokensTab = ({ accountKey }: DefiTokensTabProps) => {
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.AccountAssets>>();

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
        ({ item }: { item: DefiTokenListItem }) => (
            <AccountsListTokenItem
                token={item.token}
                account={account!}
                hasBackground
                isFirst={item.isFirst}
                isLast={item.isLast}
                onSelectAccount={() =>
                    navigation.navigate(RootStackRoutes.AccountDetail, {
                        accountKey,
                        tokenContract: item.token.contract,
                        closeActionType: 'back',
                    })
                }
            />
        ),
        [account, accountKey, navigation],
    );

    if (!account) return null;

    return <FlashList data={listItems} keyExtractor={item => item.id} renderItem={renderItem} />;
};
