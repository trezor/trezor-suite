import { Color } from './colors';

export type Elevation = -1 | 0 | 1 | 2 | 3;

export const nextElevation: Record<Elevation, Elevation> = {
    '-1': 0,
    0: 1,
    1: 2,
    2: 3,
    3: 0, // We cycle elevations when we run out of them (just to make it work somehow, this shall not happen). We intentionally never cycle into negative elevations.
};

export const mapElevationToBackground: Record<Elevation, Color> = {
    '-1': 'backgroundSurfaceElevationNegative', // For example left menu is negative elevation
    0: 'backgroundSurfaceElevation0',
    1: 'backgroundSurfaceElevation1',
    2: 'backgroundSurfaceElevation2',
    3: 'backgroundSurfaceElevation3',
};
