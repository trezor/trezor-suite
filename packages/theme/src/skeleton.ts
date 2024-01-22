import {
    standardBackgroundElevationColors as stdBg,
    darkBackgroundElevationColors as darkBg,
} from './background';
import { Elevation } from './elevation';

export const standardSkeletonColors = {
    skeletonForegroundElevationNegative: stdBg.backgroundSurfaceElevation0,
    skeletonForegroundElevation0: stdBg.backgroundSurfaceElevationNegative,
    skeletonForegroundElevation1: stdBg.backgroundSurfaceElevation0,
    skeletonForegroundElevation2: stdBg.backgroundSurfaceElevation1,
    skeletonForegroundElevation3: stdBg.backgroundSurfaceElevation0,
};

type SkeletonColor = keyof typeof standardSkeletonColors;

export const darkSkeletonColors = {
    skeletonForegroundElevationNegative: darkBg.backgroundSurfaceElevation0,
    skeletonForegroundElevation0: darkBg.backgroundSurfaceElevationNegative,
    skeletonForegroundElevation1: darkBg.backgroundSurfaceElevation0,
    skeletonForegroundElevation2: darkBg.backgroundSurfaceElevation1,
    skeletonForegroundElevation3: darkBg.backgroundSurfaceElevation0,
};

export const mapElevationToSkeletonForeground: Record<Elevation, SkeletonColor> = {
    '-1': 'skeletonForegroundElevationNegative', // For example left menu is negative elevation
    0: 'skeletonForegroundElevation0',
    1: 'skeletonForegroundElevation1',
    2: 'skeletonForegroundElevation2',
    3: 'skeletonForegroundElevation3',
};
