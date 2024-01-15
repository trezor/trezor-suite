/**
 * @deprecated use ElevationContext
 */
export type SkeletonElevation = 0 | 1 | 2 | 3;

export type SkeletonBaseProps = {
    background?: string;
    animate?: boolean;
    elevation?: SkeletonElevation;
};
