import { HStack } from '@suite-native/atoms';

import { SkeletonLarge } from './SkeletonLarge';

export type SkeletonRowProps = {
    leftWidthPercentage: number;
    rightWidthPercentage: number;
};

export const SkeletonLargeRow = ({
    leftWidthPercentage,
    rightWidthPercentage,
}: SkeletonRowProps) => (
    <HStack justifyContent="space-between" alignItems="center">
        <SkeletonLarge widthPercentage={leftWidthPercentage} height={46} />
        <SkeletonLarge widthPercentage={rightWidthPercentage} height={46} />
    </HStack>
);
