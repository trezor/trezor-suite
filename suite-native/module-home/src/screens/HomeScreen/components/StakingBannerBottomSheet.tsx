import React from 'react';

import { Account } from '@suite-common/wallet-types';
import { AccountsListItem } from '@suite-native/accounts';
import { BottomSheetFlashList, Box, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type AccountSelectBottomSheetProps = {
    data: Account[];
    onSelect: (item: Account) => void;
    onClose: () => void;
};

const ESTIMATED_ITEM_SIZE = 82;

export const StakingBannerBottomSheet = React.memo(
    ({ data, onSelect, onClose }: AccountSelectBottomSheetProps) => (
        <BottomSheetFlashList<Account>
            isVisible
            onClose={onClose}
            title={
                <Box padding="sp16">
                    <Text variant="titleSmall">
                        <Translation id="moduleHome.stakingBanner.bottomSheetTitle" />
                    </Text>
                </Box>
            }
            data={data}
            renderItem={({ item }) => (
                <AccountsListItem
                    account={item}
                    hasBackground
                    isFirst={item.index === 0}
                    isLast={item.index === data.length - 1}
                    onPress={() => onSelect(item)}
                />
            )}
            estimatedItemSize={ESTIMATED_ITEM_SIZE}
            estimatedListHeight={ESTIMATED_ITEM_SIZE * data.length * 1.5}
        />
    ),
);
