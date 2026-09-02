import { Fragment, useCallback } from 'react';

import {
    BottomSheetModal,
    type BottomSheetModalRef,
    Box,
    Card,
    Divider,
} from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { YieldClaimAccountCard } from './YieldClaimAccountCard';
import { type StablecoinYieldClaimItem } from '../../utils/yield/stablecoinYieldClaimSummaryUtils';

interface YieldClaimRewardsBottomSheetProps {
    ref: BottomSheetModalRef;
    claimItems: StablecoinYieldClaimItem[];
    onClaimRewardPress: (claimItem: StablecoinYieldClaimItem) => void;
    onClose: () => void;
}

export const YieldClaimRewardsBottomSheet = ({
    ref,
    claimItems,
    onClaimRewardPress,
    onClose,
}: YieldClaimRewardsBottomSheetProps) => {
    const onClaimRewardsSelect = useCallback(
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
                            <YieldClaimAccountCard
                                summary={claimItem.summary}
                                onPress={() => onClaimRewardsSelect(claimItem)}
                            />
                        </Fragment>
                    ))}
                </Card>
            </Box>
        </BottomSheetModal>
    );
};
