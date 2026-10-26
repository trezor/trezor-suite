import { BoxSkeleton } from '@suite-native/atoms';

export type SkeletonLargeProps = {
    widthPercentage: number;
    height?: number;
};

const SKELETON_LARGE_HEIGHT = 60;

export const SkeletonLarge = ({
    widthPercentage,
    height = SKELETON_LARGE_HEIGHT,
}: SkeletonLargeProps) => (
    <BoxSkeleton width={`${widthPercentage * 100}%`} height={height} borderRadius="r16" />
);
