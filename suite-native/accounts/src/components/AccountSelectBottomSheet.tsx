import React, { useCallback } from 'react';

import { FlashList } from '@shopify/flash-list';

import { BottomSheet } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { AccountSelectBottomSheetSection, OnSelectAccount } from '../types';
import { AccountsListItem } from './AccountsList/AccountsListItem';
import { AccountSectionTitle } from './AccountSectionTitle';
import { AccountsListTokenItem } from './AccountsList/AccountsListTokenItem';

type AccountSelectBottomSheetProps = {
    data: AccountSelectBottomSheetSection[];
    onSelectAccount: OnSelectAccount;
    onClose: () => void;
};

const contentContainerStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.medium,
}));

export const AccountSelectBottomSheet = React.memo(
    ({ data, onSelectAccount, onClose }: AccountSelectBottomSheetProps) => {
        const { applyStyle } = useNativeStyles();

        const renderItem = useCallback(
            ({ item }: { item: AccountSelectBottomSheetSection }) => {
                switch (item.type) {
                    case 'sectionTitle':
                        return <AccountSectionTitle {...item} />;
                    case 'account':
                        return (
                            <AccountsListItem
                                {...item}
                                hasBackground
                                showDivider
                                onPress={() => onSelectAccount(item)}
                            />
                        );
                    case 'staking':
                        // TODO: Implement staking section
                        return null;
                    case 'token':
                        const { token, account } = item;

                        return (
                            <AccountsListTokenItem
                                {...item}
                                hasBackground
                                onSelectAccount={() =>
                                    onSelectAccount({
                                        account,
                                        tokenAddress: token.contract,
                                        hasAnyKnownTokens: true,
                                    })
                                }
                            />
                        );
                    default:
                        return null;
                }
            },
            [onSelectAccount],
        );

        return (
            <BottomSheet isVisible isCloseDisplayed={false} onClose={onClose} isScrollable={false}>
                <FlashList
                    data={data}
                    renderItem={renderItem}
                    contentContainerStyle={applyStyle(contentContainerStyle)}
                    estimatedItemSize={76}
                />
            </BottomSheet>
        );
    },
);
