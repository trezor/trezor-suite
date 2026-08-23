import { useCallback } from 'react';

import { BottomSheetModal, type BottomSheetModalRef, Box } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { EarnAccountCard } from './EarnAccountCard';
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
            title={<Translation id="earn.earnScreen.activeSheet.yieldPositionsTitle" />}
            isCloseDisplayed
            onClose={onClose}
        >
            <Box paddingTop="sp16">
                {claimItems.map(claimItem =>
                    claimItem.positions.length > 0 ? (
                        claimItem.positions.map(position => (
                            <EarnAccountCard
                                key={position.id}
                                item={position}
                                onPress={() => handleClaimRewardsSelect(claimItem)}
                            />
                        ))
                    ) : (
                        <StablecoinYieldClaimAccountCard
                            key={claimItem.summary.accountKey}
                            accountKey={claimItem.summary.accountKey}
                            fiatClaimableAmount={claimItem.summary.fiatClaimableAmount}
                            networkSymbol={claimItem.summary.networkSymbol}
                            onPress={() => handleClaimRewardsSelect(claimItem)}
                        />
                    ),
                )}
            </Box>
        </BottomSheetModal>
    );
};
