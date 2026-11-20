import { useCallback } from 'react';

import { FlashList } from '@shopify/flash-list';

import { type StakingPositionEntry } from '@suite-common/earn-staking';
import { BottomSheetModal, type BottomSheetModalRef, Box } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { StakingPositionCard } from './StakingPositionCard';

type StakingPositionsBottomSheetProps = {
    ref: BottomSheetModalRef;
    positionEntries: readonly StakingPositionEntry[];
    onClose: () => void;
};

export const StakingPositionsBottomSheet = ({
    ref,
    positionEntries,
    onClose,
}: StakingPositionsBottomSheetProps) => {
    const renderItem = useCallback(
        ({ item }: { item: StakingPositionEntry }) => (
            <StakingPositionCard entry={item} onClose={onClose} />
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
                    data={positionEntries}
                    keyExtractor={item => `${item.accountKey}:${item.descriptor.id}`}
                    renderItem={renderItem}
                />
            </Box>
        </BottomSheetModal>
    );
};
