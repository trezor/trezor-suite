import React, { useCallback } from 'react';

import { BottomSheetFlashList } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useToast } from '@suite-native/toasts';

import { type AccountSelectBottomSheetSection, type OnSelectAccount } from '../types';
import { AccountSectionTitle } from './AccountSectionTitle';
import { AccountsListItem } from './AccountsList/AccountsListItem';
import { AccountsListStakingItem } from './AccountsList/AccountsListStakingItem';
import { AccountsListTokenItem } from './AccountsList/AccountsListTokenItem';

type AccountSelectBottomSheetProps = {
    data: AccountSelectBottomSheetSection[];
    onSelectAccount: OnSelectAccount;
    isStakingPressable?: boolean;
    onClose: () => void;
    isVisible: boolean;
};

const ESTIMATED_ITEM_SIZE = 76;

export const AccountSelectBottomSheet = React.memo(
    ({
        data,
        onSelectAccount,
        onClose,
        isStakingPressable = false,
        isVisible,
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
                                isNativeCoinOnly
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
                                            intent: 'warning',
                                            message: (
                                                <Translation id="accountList.stakingDisabled" />
                                            ),
                                        });
                                    }
                                }}
                            />
                        );
                    case 'token': {
                        const { token, account } = item;

                        return (
                            <AccountsListTokenItem
                                {...item}
                                hasBackground
                                onSelectAccount={() =>
                                    onSelectAccount({
                                        account,
                                        tokenAddress: token.contract,
                                        tokenSymbol: token.symbol,
                                        hasAnyKnownTokens: true,
                                    })
                                }
                            />
                        );
                    }
                    default:
                        return null;
                }
            },
            [isStakingPressable, onSelectAccount, showToast],
        );

        return (
            <BottomSheetFlashList<AccountSelectBottomSheetSection>
                isVisible={isVisible}
                onClose={onClose}
                data={data}
                renderItem={renderItem}
                estimatedListHeight={ESTIMATED_ITEM_SIZE * data.length * 1.5}
            />
        );
    },
);
