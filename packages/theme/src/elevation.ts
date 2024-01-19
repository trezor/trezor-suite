export type Elevation = -1 | 0 | 1 | 2 | 3;

export const nextElevation: Record<Elevation, Elevation> = {
    '-1': 0,
    0: 1,
    1: 2,
    2: 3,
    // We cycle elevations when we run out of them (just to make it work somehow, this shall not happen).
    // We intentionally never cycle into negative elevations.
    3: 0,
};
