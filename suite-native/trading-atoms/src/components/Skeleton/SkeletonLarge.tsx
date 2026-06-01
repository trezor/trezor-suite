import { useWindowDimensions } from 'react-native';

import { BoxSkeleton } from '@suite-native/atoms';

export type SkeletonLargeProps = {
    widthPercentage: number;
    height?: number;
};

const SKELETON_LARGE_HEIGHT = 60;

export const SkeletonLarge = ({
    widthPercentage,
    height = SKELETON_LARGE_HEIGHT,
}: SkeletonLargeProps) => {
    const { width } = useWindowDimensions();

    return <BoxSkeleton width={width * widthPercentage} height={height} borderRadius="r16" />;
};
