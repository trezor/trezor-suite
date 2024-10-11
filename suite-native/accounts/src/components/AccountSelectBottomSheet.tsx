import React, { useCallback } from 'react';

import { BottomSheetFlashList } from '@suite-native/atoms';
import { ToastRenderer, useToast } from '@suite-native/toasts';
import { Translation } from '@suite-native/intl';

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

const ESTIMATED_ITEM_SIZE = 76;

export const AccountSelectBottomSheet = React.memo(
    ({
        data,
        onSelectAccount,
        isStakingPressable = false,
        onClose,
    }: AccountSelectBottomSheetProps) => {
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
                                            message: (
                                                <Translation id="accountList.stakingDisabled" />
                                            ),
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
            <BottomSheetFlashList<AccountSelectBottomSheetSection>
                isVisible
                isCloseDisplayed={false}
                onClose={onClose}
                data={data}
                renderItem={renderItem}
                estimatedItemSize={ESTIMATED_ITEM_SIZE}
                estimatedListHeight={ESTIMATED_ITEM_SIZE * data.length}
                ExtraProvider={ToastRenderer}
            />
        );
    },
);
