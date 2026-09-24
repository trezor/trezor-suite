import { useCallback } from 'react';

import { FlashList } from '@shopify/flash-list';

import { BottomSheetModal, type BottomSheetModalRef, Box } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { YieldPositionCard } from './YieldPositionCard';
import { type YieldListItem } from '../../types';

type YieldPositionsBottomSheetProps = {
    ref: BottomSheetModalRef;
    positions: YieldListItem[];
    onClose: () => void;
};

export const YieldPositionsBottomSheet = ({
    ref,
    positions,
    onClose,
}: YieldPositionsBottomSheetProps) => {
    const renderItem = useCallback(
        ({ item }: { item: YieldListItem }) => <YieldPositionCard item={item} onClose={onClose} />,
        [onClose],
    );

    return (
        <BottomSheetModal
            ref={ref}
            title={<Translation id="earn.earnScreen.activeSheet.yieldPositionsTitle" />}
            isCloseDisplayed
            onClose={onClose}
        >
            <Box paddingTop="sp16">
                <FlashList
                    data={positions}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                />
            </Box>
        </BottomSheetModal>
    );
};
