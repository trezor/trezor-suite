import { BackgroundElevationColor, Elevation } from '@trezor/theme';

export const mapElevationToSkeletonForeground: Record<Elevation, BackgroundElevationColor> = {
    '-1': 'backgroundSurfaceElevation0',
    0: 'backgroundSurfaceElevationNegative',
    1: 'backgroundSurfaceElevation0',
    2: 'backgroundSurfaceElevation1',
    3: 'backgroundSurfaceElevation0',
};
