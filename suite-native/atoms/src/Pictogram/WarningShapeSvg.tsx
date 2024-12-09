import Svg, { Path } from 'react-native-svg';

import { useNativeStyles } from '@trezor/styles';

export const WarningShapeSvg = () => {
    const { utils } = useNativeStyles();
    const borderColor = utils.colors.backgroundAlertYellowSubtleOnElevationNegative;
    const backgroundColor = utils.colors.backgroundAlertYellowSubtleOnElevation1;

    return (
        <Svg width={112} height={112} fill="none">
            <Path
                d="M103.916 104C110.125 104 113.967 97.2358 110.788 91.9032L62.8665 11.5262C59.7635 6.32172 52.2259 6.32202 49.1233 11.5268L1.21057 91.9038C-1.96816 97.2363 1.87422 104 8.08231 104H103.916Z"
                fill={borderColor}
            />
            <Path
                d="M93.3051 92.64C95.6251 92.64 97.0671 90.1194 95.8913 88.1195L58.4176 24.3846C57.2577 22.4119 54.405 22.412 53.2453 24.3848L15.7784 88.1197C14.6027 90.1196 16.0448 92.64 18.3646 92.64H93.3051Z"
                fill={backgroundColor}
            />
        </Svg>
    );
};
