import { BoxSkeleton } from '@suite-native/atoms';

export type SkeletonSmallProps = {
    widthPercentage: number;
    height?: number;
};

const SKELETON_SMALL_HEIGHT = 20;

export const SkeletonSmall = ({
    widthPercentage,
    height = SKELETON_SMALL_HEIGHT,
}: SkeletonSmallProps) => <BoxSkeleton width={`${widthPercentage * 100}%`} height={height} />;
