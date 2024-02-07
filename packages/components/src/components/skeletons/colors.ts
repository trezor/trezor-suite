import { CSSColor, Color, Colors, Elevation } from '@trezor/theme';

type StyledComponentElevationProps = {
    theme: Colors; // this package does not depend on styled-components
    elevation: Elevation;
};

export const mapElevationToSkeletonForeground = ({
    theme,
    elevation,
}: StyledComponentElevationProps): CSSColor => {
    const map: Record<Elevation, Color> = {
        '-1': 'backgroundSurfaceElevation0',
        0: 'backgroundSurfaceElevationNegative',
        1: 'backgroundSurfaceElevation0',
        2: 'backgroundSurfaceElevation1',
        3: 'backgroundSurfaceElevation0',
    };

    return theme[map[elevation]];
};
