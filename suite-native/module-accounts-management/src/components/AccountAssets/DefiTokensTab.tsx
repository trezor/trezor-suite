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
import { TokenYieldRateBadge } from '@suite-native/module-earn';

import { type OnSelectAsset } from './types';

type DefiTokenListItem = {
    type: 'token';
    id: string;
    token: TokenInfoBranded;
    isFirst: boolean;
    isLast: boolean;
};

type DefiTokensTabProps = {
    accountKey: AccountKey;
    onSelect: OnSelectAsset;
};

export const DefiTokensTab = ({ accountKey, onSelect }: DefiTokensTabProps) => {
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
                badges={
                    <TokenYieldRateBadge account={account!} token={item.token} variant="active" />
                }
                onSelectAccount={() =>
                    onSelect({ tokenContract: item.token.contract, tokenSymbol: item.token.symbol })
                }
            />
        ),
        [account, onSelect],
    );

    if (!account) return null;

    return <FlashList data={listItems} keyExtractor={item => item.id} renderItem={renderItem} />;
};
