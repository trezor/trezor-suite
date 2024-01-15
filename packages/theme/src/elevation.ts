import { Color } from './colors';

export type Elevation = 0 | 1 | 2 | 3;

export const nextElevation: Record<Elevation, Elevation> = {
    0: 1,
    1: 2,
    2: 3,
    3: 0,
};

export const mapElevationToBackground: Record<Elevation, Color> = {
    0: 'backgroundSurfaceElevation0',
    1: 'backgroundSurfaceElevation1',
    2: 'backgroundSurfaceElevation2',
    3: 'backgroundSurfaceElevation3',
};
