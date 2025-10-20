import { Dimensions } from 'react-native';

import { BoxSkeleton } from '@suite-native/atoms';

export type SkeletonSmallProps = {
    widthPercentage: number;
};

const SKELETON_SMALL_HEIGHT = 20;

export const SkeletonSmall = ({ widthPercentage }: SkeletonSmallProps) => (
    <BoxSkeleton
        width={Dimensions.get('window').width * widthPercentage}
        height={SKELETON_SMALL_HEIGHT}
    />
);
