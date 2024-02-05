import { Color, Elevation } from '@trezor/theme';

export const mapElevationToSkeletonForeground: Record<Elevation, Color> = {
    '-1': 'backgroundSurfaceElevation0',
    0: 'backgroundSurfaceElevationNegative',
    1: 'backgroundSurfaceElevation0',
    2: 'backgroundSurfaceElevation1',
    3: 'backgroundSurfaceElevation0',
};
