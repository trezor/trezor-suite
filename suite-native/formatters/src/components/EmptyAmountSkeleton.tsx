import { BoxSkeleton, HStack } from '@suite-native/atoms';
import { getWindowWidth } from '@trezor/env-utils';
import { useNativeStyles } from '@trezor/styles';
import { TypographyStyle } from '@trezor/theme';

import { EmptyAmountText } from './EmptyAmountText';

type EmptyAmountSkeletonProps = {
    variant?: TypographyStyle;
};

const SKELETON_WIDTH = 0.2 * getWindowWidth();

export const EmptyAmountSkeleton = ({ variant = 'body' }: EmptyAmountSkeletonProps) => {
    const { utils } = useNativeStyles();

    // Only font size is too small, only line height is too big.
    const { fontSize, lineHeight } = utils.typography[variant];
    const skeletonHeight = (fontSize + lineHeight) / 2;

    return (
        // Usage of EmptyAmountText ensures the correct line height.
        <HStack alignItems="center" spacing={0}>
            <EmptyAmountText variant={variant} />
            <BoxSkeleton width={SKELETON_WIDTH} height={skeletonHeight} borderRadius="r4" />
        </HStack>
    );
};
