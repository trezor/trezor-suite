import { Fragment, useCallback } from 'react';

import {
    BottomSheetModal,
    type BottomSheetModalRef,
    Box,
    Card,
    Divider,
} from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { StablecoinYieldClaimAccountCard } from './StablecoinYieldClaimAccountCard';
import { type StablecoinYieldClaimItem } from '../utils/stablecoinYieldClaimSummaryUtils';

type StablecoinYieldClaimRewardsBottomSheetProps = {
    ref: BottomSheetModalRef;
    claimItems: StablecoinYieldClaimItem[];
    onClaimRewardPress: (claimItem: StablecoinYieldClaimItem) => void;
    onClose: () => void;
};

export const StablecoinYieldClaimRewardsBottomSheet = ({
    ref,
    claimItems,
    onClaimRewardPress,
    onClose,
}: StablecoinYieldClaimRewardsBottomSheetProps) => {
    const handleClaimRewardsSelect = useCallback(
        (claimItem: StablecoinYieldClaimItem) => {
            onClose();
            onClaimRewardPress(claimItem);
        },
        [onClaimRewardPress, onClose],
    );

    return (
        <BottomSheetModal
            ref={ref}
            title={<Translation id="earn.earnScreen.claimRewards.title" />}
            subtitle={<Translation id="earn.earnScreen.claimRewards.subtitle" />}
            isCloseDisplayed
            onClose={onClose}
        >
            <Box paddingTop="sp16">
                <Card borderColor="borderNeutral" noPadding>
                    {claimItems.map((claimItem, index) => (
                        <Fragment key={claimItem.summary.accountKey}>
                            {index > 0 && <Divider />}
                            <StablecoinYieldClaimAccountCard
                                summary={claimItem.summary}
                                onPress={() => handleClaimRewardsSelect(claimItem)}
                            />
                        </Fragment>
                    ))}
                </Card>
            </Box>
        </BottomSheetModal>
    );
};
