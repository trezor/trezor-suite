import { Elevation } from './elevation';

export const standardSkeletonColors = {
    skeletonBackgroundElevationNegative: '#eeeeeeff',
    skeletonForegroundElevationNegative: '#f6f6f6ff',

    skeletonBackgroundElevation0: '#f6f6f6',
    skeletonForegroundElevation0: '#eeeeee',

    skeletonBackgroundElevation1: '#ffffff',
    skeletonForegroundElevation1: '#f6f6f6',
};

type SkeletonColor = keyof typeof standardSkeletonColors;

export const darkSkeletonColors = {
    skeletonBackgroundElevationNegative: '#000000ff',
    skeletonForegroundElevationNegative: '#161716ff',

    skeletonBackgroundElevation0: '#161716ff',
    skeletonForegroundElevation0: '#000000ff',

    skeletonBackgroundElevation1: '#ffffffff',
    skeletonForegroundElevation1: '#161716ff',
};

export const mapElevationToSkeletonBackground: Record<Elevation, SkeletonColor> = {
    '-1': 'skeletonBackgroundElevationNegative', // For example left menu is negative elevation
    0: 'skeletonBackgroundElevation0',
    1: 'skeletonBackgroundElevation1',
    2: 'skeletonBackgroundElevation0',
    3: 'skeletonBackgroundElevation1',
};

export const mapElevationToSkeletonForeground: Record<Elevation, SkeletonColor> = {
    '-1': 'skeletonForegroundElevationNegative', // For example left menu is negative elevation
    0: 'skeletonForegroundElevation0',
    1: 'skeletonForegroundElevation1',
    2: 'skeletonForegroundElevation0',
    3: 'skeletonForegroundElevation1',
};
