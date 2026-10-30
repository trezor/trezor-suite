import { useCallback } from 'react';

import { FlashList } from '@shopify/flash-list';

import { type StakingListItem } from '@suite-common/wallet-core';
import { BottomSheetModal, type BottomSheetModalRef, Box } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { StakingPositionCard } from './StakingPositionCard';

type StakingPositionsBottomSheetProps = {
    ref: BottomSheetModalRef;
    positions: StakingListItem[];
    onClose: () => void;
};

export const StakingPositionsBottomSheet = ({
    ref,
    positions,
    onClose,
}: StakingPositionsBottomSheetProps) => {
    const renderItem = useCallback(
        ({ item }: { item: StakingListItem }) => (
            <StakingPositionCard item={item} onClose={onClose} />
        ),
        [onClose],
    );

    return (
        <BottomSheetModal
            ref={ref}
            title={<Translation id="earn.earnScreen.activeSheet.stakingPositionsTitle" />}
            isCloseDisplayed
            onClose={onClose}
        >
            <Box paddingTop="sp16">
                <FlashList
                    data={positions}
                    keyExtractor={item => item.accountKey}
                    renderItem={renderItem}
                />
            </Box>
        </BottomSheetModal>
    );
};
