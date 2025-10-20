import { Dimensions } from 'react-native';

import { BoxSkeleton } from '@suite-native/atoms';

export type SkeletonLargeProps = {
    widthPercentage: number;
};

const SKELETON_LARGE_HEIGHT = 60;

export const SkeletonLarge = ({ widthPercentage }: SkeletonLargeProps) => (
    <BoxSkeleton
        width={Dimensions.get('window').width * widthPercentage}
        height={SKELETON_LARGE_HEIGHT}
        borderRadius="r16"
    />
);
