import { Fragment } from 'react';

import { type YieldClaimAccountItem } from '@suite-common/wallet-core';
import {
    BottomSheetModal,
    type BottomSheetModalRef,
    Box,
    Card,
    Divider,
} from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { YieldClaimRewardsAccountCard } from './YieldClaimRewardsAccountCard';

type YieldClaimRewardsBottomSheetProps = {
    ref: BottomSheetModalRef;
    items: YieldClaimAccountItem[];
    onClose: () => void;
    onAccountSelect: () => void;
    onDismiss: () => void;
};

export const YieldClaimRewardsBottomSheet = ({
    ref,
    items,
    onClose,
    onAccountSelect,
    onDismiss,
}: YieldClaimRewardsBottomSheetProps) => (
    <BottomSheetModal
        ref={ref}
        title={<Translation id="earn.earnScreen.claimRewards.title" />}
        isCloseDisplayed
        onClose={onClose}
        onDismiss={onDismiss}
    >
        <Box paddingTop="sp16">
            <Card borderColor="borderNeutral" noPadding>
                {items.map((claimItem, index) => (
                    <Fragment key={claimItem.summary.accountKey}>
                        {index > 0 && <Divider />}
                        <YieldClaimRewardsAccountCard item={claimItem} onClose={onAccountSelect} />
                    </Fragment>
                ))}
            </Card>
        </Box>
    </BottomSheetModal>
);
