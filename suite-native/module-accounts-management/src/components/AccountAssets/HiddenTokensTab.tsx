import { useCallback } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';

import { FlashList } from '@shopify/flash-list';

import {
    type AccountsRootState,
    type TokensRootState,
    selectAccountByKey,
    selectAccountManuallyHiddenTokens,
    selectAccountUnrecognizedTokens,
} from '@suite-common/wallet-core';
import { type AccountKey, type TokenInfoBranded } from '@suite-common/wallet-types';
import { AccountsListTokenItem } from '@suite-native/accounts';
import { Card, InlineAlertBox, PictogramTitleHeader, Text } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { type OnSelectAsset } from './types';

type SectionHeaderListItem = { type: 'section-header'; id: string; translationId: TxKeyPath };
type WarningListItem = { type: 'warning'; id: string };
type TokenListItem = {
    type: 'token';
    id: string;
    token: TokenInfoBranded;
    isFirst: boolean;
    isLast: boolean;
};
type HiddenListItem = SectionHeaderListItem | WarningListItem | TokenListItem;

type HiddenTokensTabProps = {
    accountKey: AccountKey;
    onSelect: OnSelectAsset;
};

const sectionHeaderStyle = prepareNativeStyle(utils => ({
    paddingBottom: utils.spacings.sp8,
}));

const warningWrapperStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.surfaceFillRaised,
    borderTopLeftRadius: utils.borders.radii.r16,
    borderTopRightRadius: utils.borders.radii.r16,
    overflow: 'hidden',
    paddingTop: utils.spacings.sp16,
    paddingHorizontal: utils.spacings.sp16,
}));

const buildListItems = (
    manuallyHiddenTokens: TokenInfoBranded[],
    unrecognizedTokens: TokenInfoBranded[],
): HiddenListItem[] => {
    const listItems: HiddenListItem[] = [];

    if (manuallyHiddenTokens.length > 0) {
        manuallyHiddenTokens.forEach((token, index) => {
            listItems.push({
                type: 'token',
                id: token.contract,
                token,
                isFirst: index === 0,
                isLast: index === manuallyHiddenTokens.length - 1,
            });
        });
    }

    if (unrecognizedTokens.length > 0) {
        listItems.push({
            type: 'section-header',
            id: 'header-unrecognized',
            translationId: 'moduleAccountManagement.accountAssetsScreen.hiddenTokensSection.title',
        });
        listItems.push({ type: 'warning', id: 'warning-unrecognized' });
        unrecognizedTokens.forEach((token, index) => {
            listItems.push({
                type: 'token',
                id: `unrecognized-${token.contract}`,
                token,
                isFirst: false,
                isLast: index === unrecognizedTokens.length - 1,
            });
        });
    }

    return listItems;
};

export const HiddenTokensTab = ({ accountKey, onSelect }: HiddenTokensTabProps) => {
    const { applyStyle } = useNativeStyles();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const manuallyHiddenTokens = useSelector((state: TokensRootState) =>
        selectAccountManuallyHiddenTokens(state, accountKey),
    );
    const unrecognizedTokens = useSelector((state: TokensRootState) =>
        selectAccountUnrecognizedTokens(state, accountKey),
    );

    const listItems = buildListItems(manuallyHiddenTokens, unrecognizedTokens);

    const renderItem = useCallback(
        ({ item }: { item: HiddenListItem }) => {
            switch (item.type) {
                case 'section-header':
                    return (
                        <View style={applyStyle(sectionHeaderStyle)}>
                            <Text variant="headline-sm">
                                <Translation id={item.translationId} />
                            </Text>
                        </View>
                    );
                case 'warning':
                    return (
                        <View style={applyStyle(warningWrapperStyle)}>
                            <InlineAlertBox
                                intent="warning"
                                title={
                                    <Translation id="moduleAccountManagement.accountAssetsScreen.hiddenTokensSection.warning" />
                                }
                            />
                        </View>
                    );
                case 'token':
                    return (
                        <AccountsListTokenItem
                            token={item.token}
                            account={account!}
                            hasBackground
                            isFirst={item.isFirst}
                            isLast={item.isLast}
                            showFiatValue={false}
                            onSelectAccount={() =>
                                onSelect({
                                    tokenContract: item.token.contract,
                                    tokenSymbol: item.token.symbol,
                                })
                            }
                        />
                    );
            }
        },
        [account, applyStyle, onSelect],
    );

    if (listItems.length === 0) {
        return (
            <Card>
                <PictogramTitleHeader
                    variant="info"
                    icon="coins"
                    title={
                        <Translation id="moduleAccountManagement.accountAssetsScreen.hiddenTokensSection.emptyTitle" />
                    }
                />
            </Card>
        );
    }

    if (!account) return null;

    return (
        <FlashList
            data={listItems}
            keyExtractor={item => item.id}
            getItemType={item => item.type}
            renderItem={renderItem}
        />
    );
};
