import { Fragment } from 'react';

import {
    BottomSheetModal,
    type BottomSheetModalRef,
    Box,
    Card,
    Divider,
} from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { YieldClaimRewardsAccountCard } from './YieldClaimRewardsAccountCard';
import { type YieldClaimAccountItem } from '../../types';

type YieldClaimRewardsBottomSheetProps = {
    ref: BottomSheetModalRef;
    items: YieldClaimAccountItem[];
    onClose: () => void;
};

export const YieldClaimRewardsBottomSheet = ({
    ref,
    items,
    onClose,
}: YieldClaimRewardsBottomSheetProps) => (
    <BottomSheetModal
        ref={ref}
        title={<Translation id="earn.earnScreen.claimRewards.title" />}
        isCloseDisplayed
        onClose={onClose}
    >
        <Box paddingTop="sp16">
            <Card borderColor="borderNeutral" noPadding>
                {items.map((claimItem, index) => (
                    <Fragment key={claimItem.summary.accountKey}>
                        {index > 0 && <Divider />}
                        <YieldClaimRewardsAccountCard item={claimItem} onClose={onClose} />
                    </Fragment>
                ))}
            </Card>
        </Box>
    </BottomSheetModal>
);
