import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectIsDeviceConnected } from '@suite-common/wallet-core';
import { DeviceConnectionGuardScreen } from '@suite-native/device-authorization';
import type { TradingOutputsReviewScreenNavigationProp } from '@suite-native/trading-types';

import { ReviewOutputsContent, ReviewOutputsContentProps } from './ReviewOutputsContent';

export type DeviceGuardedReviewOutputsProps = ReviewOutputsContentProps;

export const DeviceGuardedReviewOutputs = (props: DeviceGuardedReviewOutputsProps) => {
    const { popToTop } = useNavigation<TradingOutputsReviewScreenNavigationProp>();

    const isDeviceConnected = useSelector(selectIsDeviceConnected);

    if (!isDeviceConnected) {
        return <DeviceConnectionGuardScreen onCancel={popToTop} />;
    }

    return <ReviewOutputsContent {...props} />;
};
