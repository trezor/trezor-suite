import {
    standardBackgroundElevationColors as stdBg,
    darkBackgroundElevationColors as darkBg,
} from './background';
import { Elevation } from './elevation';

export const standardSkeletonColors = {
    skeletonBackgroundElevationNegative: stdBg.backgroundSurfaceElevationNegative,
    skeletonForegroundElevationNegative: stdBg.backgroundSurfaceElevation0,

    skeletonBackgroundElevation0: stdBg.backgroundSurfaceElevation0,
    skeletonForegroundElevation0: stdBg.backgroundSurfaceElevationNegative,

    skeletonBackgroundElevation1: stdBg.backgroundSurfaceElevation1,
    skeletonForegroundElevation1: stdBg.backgroundSurfaceElevation0,

    skeletonBackgroundElevation2: stdBg.backgroundSurfaceElevation2,
    skeletonForegroundElevation2: stdBg.backgroundSurfaceElevation1,

    skeletonBackgroundElevation3: stdBg.backgroundSurfaceElevation3,
    skeletonForegroundElevation3: stdBg.backgroundSurfaceElevation0,
};

type SkeletonColor = keyof typeof standardSkeletonColors;

export const darkSkeletonColors = {
    skeletonBackgroundElevationNegative: darkBg.backgroundSurfaceElevationNegative,
    skeletonForegroundElevationNegative: darkBg.backgroundSurfaceElevation0,

    skeletonBackgroundElevation0: darkBg.backgroundSurfaceElevation0,
    skeletonForegroundElevation0: darkBg.backgroundSurfaceElevationNegative,

    skeletonBackgroundElevation1: darkBg.backgroundSurfaceElevation1,
    skeletonForegroundElevation1: darkBg.backgroundSurfaceElevation0,

    skeletonBackgroundElevation2: darkBg.backgroundSurfaceElevation2,
    skeletonForegroundElevation2: darkBg.backgroundSurfaceElevation1,

    skeletonBackgroundElevation3: darkBg.backgroundSurfaceElevation3,
    skeletonForegroundElevation3: darkBg.backgroundSurfaceElevation0,
};

export const mapElevationToSkeletonBackground: Record<Elevation, SkeletonColor> = {
    '-1': 'skeletonBackgroundElevationNegative', // For example left menu is negative elevation
    0: 'skeletonBackgroundElevation0',
    1: 'skeletonBackgroundElevation1',
    2: 'skeletonBackgroundElevation2',
    3: 'skeletonBackgroundElevation3',
};

export const mapElevationToSkeletonForeground: Record<Elevation, SkeletonColor> = {
    '-1': 'skeletonForegroundElevationNegative', // For example left menu is negative elevation
    0: 'skeletonForegroundElevation0',
    1: 'skeletonForegroundElevation1',
    2: 'skeletonForegroundElevation2',
    3: 'skeletonForegroundElevation3',
};
