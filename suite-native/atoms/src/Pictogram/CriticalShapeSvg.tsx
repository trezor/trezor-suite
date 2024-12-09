import Svg, { Path } from 'react-native-svg';

import { useNativeStyles } from '@trezor/styles';

export const CriticalShapeSvg = () => {
    const { utils } = useNativeStyles();
    const borderColor = utils.colors.backgroundAlertRedSubtleOnElevationNegative;
    const backgroundColor = utils.colors.backgroundAlertRedSubtleOnElevation1;

    return (
        <Svg width={112} height={112} fill="none">
            <Path
                d="M105 36.6798C105 31.309 102.128 26.348 97.4713 23.6729L63.7306 4.29171C59.1042 1.63422 53.4143 1.63422 48.7879 4.29171L15.0472 23.6729C10.3901 26.348 7.51855 31.3089 7.51855 36.6797V75.3203C7.51855 80.6911 10.3901 85.652 15.0472 88.3272L48.7879 107.708C53.4143 110.366 59.1042 110.366 63.7306 107.708L97.4713 88.3272C102.128 85.652 105 80.6911 105 75.3203V36.6798Z"
                fill={borderColor}
            />
            <Path
                d="M93.3554 40.6462C93.3554 37.0549 91.4296 33.7393 88.31 31.9599L61.2153 16.5055C58.1444 14.7539 54.377 14.7539 51.3061 16.5055L24.2114 31.9599C21.0919 33.7393 19.166 37.0549 19.166 40.6462V71.3538C19.166 74.9452 21.0919 78.2608 24.2114 80.0401L51.3061 95.4946C54.377 97.2462 58.1444 97.2461 61.2153 95.4946L88.31 80.0401C91.4296 78.2608 93.3554 74.9452 93.3554 71.3538V40.6462Z"
                fill={backgroundColor}
            />
        </Svg>
    );
};
