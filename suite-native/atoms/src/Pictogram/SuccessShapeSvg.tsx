import Svg, { Rect } from 'react-native-svg';

import { useNativeStyles } from '@trezor/styles';

export const SuccessShapeSvg = () => {
    const { utils } = useNativeStyles();
    const borderColor = utils.colors.backgroundPrimarySubtleOnElevationNegative;
    const backgroundColor = utils.colors.backgroundPrimarySubtleOnElevation1;

    return (
        <Svg width={112} height={112} fill="none">
            <Rect x="4" y="4" width="104" height="104" rx="52" fill={borderColor} />
            <Rect x="16" y="16" width="80" height="80" rx="40" fill={backgroundColor} />
        </Svg>
    );
};
