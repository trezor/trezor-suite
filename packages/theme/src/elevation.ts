export type Elevation =
    | -1 // For example: side-bar
    | 0
    | 1
    | 2
    | 3;

export const nextElevation: Record<Elevation, Elevation> = {
    '-1': 0,
    0: 1,
    1: 2,
    2: 3,
    // We intentionally never cycle. Higher elevations shall not be visible to the user.
    3: 3,
};

export const prevElevation: Record<Elevation, Elevation> = {
    '-1': -1,
    '0': -1,
    1: 0,
    2: 1,
    3: 2,
};
