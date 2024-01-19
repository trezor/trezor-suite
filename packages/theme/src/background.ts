import { Elevation } from './elevation';

/**
 * Never use directly, use ElevationContext.
 */
export const standardBackgroundElevationColors = {
    backgroundSurfaceElevationNegative: '#eeeeeeff',
    backgroundSurfaceElevation0: '#f6f6f6ff',
    backgroundSurfaceElevation1: '#ffffffff',
    backgroundSurfaceElevation2: '#f6f6f6ff',
    backgroundSurfaceElevation3: '#ffffffff',
};

type BackgroundElevationColor = keyof typeof standardBackgroundElevationColors;

/**
 * Never use directly, use ElevationContext.
 */
export const darkBackgroundElevationColors: Record<BackgroundElevationColor, string> = {
    backgroundSurfaceElevationNegative: '#000000ff',
    backgroundSurfaceElevation0: '#0a0a0aff',
    backgroundSurfaceElevation1: '#161716ff',
    backgroundSurfaceElevation2: '#1c1e1cff',
    backgroundSurfaceElevation3: '#242524ff',
};

export const mapElevationToBackground: Record<Elevation, BackgroundElevationColor> = {
    '-1': 'backgroundSurfaceElevationNegative', // For example left menu is negative elevation
    0: 'backgroundSurfaceElevation0',
    1: 'backgroundSurfaceElevation1',
    2: 'backgroundSurfaceElevation2',
    3: 'backgroundSurfaceElevation3',
};
