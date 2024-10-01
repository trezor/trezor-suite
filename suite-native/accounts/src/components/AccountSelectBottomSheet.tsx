import React, { useCallback } from 'react';

import { FlashList } from '@shopify/flash-list';

import { BottomSheet } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { useToast } from '@suite-native/toasts';

import { AccountSelectBottomSheetSection, OnSelectAccount } from '../types';
import { AccountsListItem } from './AccountsList/AccountsListItem';
import { AccountSectionTitle } from './AccountSectionTitle';
import { AccountsListTokenItem } from './AccountsList/AccountsListTokenItem';
import { AccountsListStakingItem } from './AccountsList/AccountsListStakingItem';

type AccountSelectBottomSheetProps = {
    data: AccountSelectBottomSheetSection[];
    onSelectAccount: OnSelectAccount;
    isStakingPressable?: boolean;
    onClose: () => void;
};

const contentContainerStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp16,
}));

export const AccountSelectBottomSheet = React.memo(
    ({
        data,
        onSelectAccount,
        isStakingPressable = false,
        onClose,
    }: AccountSelectBottomSheetProps) => {
        const { applyStyle } = useNativeStyles();
        const { showToast } = useToast();

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
                                isInModal={true}
                                onPress={() => onSelectAccount(item)}
                            />
                        );
                    case 'staking':
                        return (
                            <AccountsListStakingItem
                                {...item}
                                hasBackground
                                onPress={() => {
                                    if (isStakingPressable) {
                                        onSelectAccount({
                                            account: item.account,
                                            isStaking: true,
                                            hasAnyKnownTokens: false,
                                        });
                                    } else {
                                        showToast({
                                            variant: 'warning',
                                            message: 'Staking is not available in this context.',
                                        });
                                    }
                                }}
                            />
                        );
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
            [isStakingPressable, onSelectAccount, showToast],
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
