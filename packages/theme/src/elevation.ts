export type Elevation =
    | -2 // we need this to be able to create elevation -1 (it is wrapped inside of the -2 via ElevationContext)
    | -1 // For example: side-bar
    | 0
    | 1
    | 2
    | 3;

export const nextElevation: Record<Elevation, Elevation> = {
    '-2': -1,
    '-1': 0,
    0: 1,
    1: 2,
    2: 3,
    // We cycle elevations when we run out of them (just to make it work somehow, this shall not happen).
    // We intentionally never cycle into negative elevations.
    3: 0,
};
