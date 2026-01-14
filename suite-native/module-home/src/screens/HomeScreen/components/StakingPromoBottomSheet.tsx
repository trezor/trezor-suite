import React from 'react';

import { Account } from '@suite-common/wallet-types';
import { AccountsListItem } from '@suite-native/accounts';
import { BottomSheetFlashList, Box, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type AccountSelectBottomSheetProps = {
    data: Account[] | null;
    onSelect: (item: Account) => void;
    onClose: () => void;
};

const ESTIMATED_ITEM_SIZE = 82;

export const StakingPromoBottomSheet = React.memo(
    ({ data, onSelect, onClose }: AccountSelectBottomSheetProps) => {
        if (!data || data.length === 0) return null;

        return (
            <BottomSheetFlashList<Account>
                isVisible
                onClose={onClose}
                title={
                    <Box padding="sp16">
                        <Text variant="titleSmall">
                            <Translation id="moduleHome.stakingPromo.bottomSheetTitle" />
                        </Text>
                    </Box>
                }
                data={data}
                renderItem={({ item, index }) => (
                    <AccountsListItem
                        account={item}
                        hasBackground
                        isFirst={index === 0}
                        isLast={index === data.length - 1}
                        onPress={() => onSelect(item)}
                    />
                )}
                estimatedListHeight={ESTIMATED_ITEM_SIZE * data.length * 1.5}
            />
        );
    },
);
