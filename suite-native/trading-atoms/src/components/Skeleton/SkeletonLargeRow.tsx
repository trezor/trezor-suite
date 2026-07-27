import { HStack } from '@suite-native/atoms';

import { SkeletonLarge } from './SkeletonLarge';

export type SkeletonRowProps = {
    leftWidthPercentage: number;
    rightWidthPercentage: number;
};

const CONTENT_HEIGHT = 46;

export const SkeletonLargeRow = ({
    leftWidthPercentage,
    rightWidthPercentage,
}: SkeletonRowProps) => (
    <HStack justifyContent="space-between" alignItems="center">
        <SkeletonLarge widthPercentage={leftWidthPercentage} height={CONTENT_HEIGHT} />
        <SkeletonLarge widthPercentage={rightWidthPercentage} height={CONTENT_HEIGHT} />
    </HStack>
);
