import { type CSSColor, type Color, type Colors, type Elevation } from '@trezor/theme';

type StyledComponentElevationProps = {
    theme: Colors; // this package does not depend on styled-components
    $elevation: Elevation;
};

export const mapElevationToSkeletonForeground = ({
    theme,
    $elevation,
}: StyledComponentElevationProps): CSSColor => {
    const map: Record<Elevation, Color> = {
        '-1': 'surfaceFillPage',
        0: 'surfaceFillSunken',
        1: 'surfaceFillPage',
        2: 'surfaceFillRaised',
        3: 'surfaceFillPage',
    };

    return theme[map[$elevation]];
};
