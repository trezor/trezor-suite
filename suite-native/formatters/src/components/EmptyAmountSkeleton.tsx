import { useWindowDimensions } from 'react-native';

import { BoxSkeleton, HStack } from '@suite-native/atoms';
import { useNativeStyles } from '@trezor/styles-native';
import { type NativeTypographyStyle } from '@trezor/theme';

import { EmptyAmountText } from './EmptyAmountText';

type EmptyAmountSkeletonProps = {
    variant?: NativeTypographyStyle;
};

const SKELETON_WIDTH_RATIO = 0.2;

export const EmptyAmountSkeleton = ({ variant = 'body-md' }: EmptyAmountSkeletonProps) => {
    const { utils } = useNativeStyles();
    const { width: windowWidth } = useWindowDimensions();

    // Only font size is too small, only line height is too big.
    const { fontSize, lineHeight } = utils.typography[variant];
    const skeletonHeight = (fontSize + lineHeight) / 2;

    return (
        // Usage of EmptyAmountText ensures the correct line height.
        <HStack alignItems="center" spacing={0}>
            <EmptyAmountText variant={variant} />
            <BoxSkeleton
                width={windowWidth * SKELETON_WIDTH_RATIO}
                height={skeletonHeight}
                borderRadius="r4"
            />
        </HStack>
    );
};
