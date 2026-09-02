import Svg, { Rect, type SvgProps } from 'react-native-svg';

import { useNativeStyles } from '@trezor/styles-native';

export const InfoShapeSvg = (props: SvgProps) => {
    const { utils } = useNativeStyles();
    const borderColor = utils.colors.illustrationFillInfo;
    const underlayColor = utils.colors.surfaceFillRaised;
    const backgroundColor = utils.colors.elementFillInfoSofter;

    return (
        <Svg width={112} height={112} viewBox="0 0 112 112" fill="none" {...props}>
            <Rect x="4" y="4" width="104" height="104" rx="52" fill={borderColor} />
            <Rect x="16" y="16" width="80" height="80" rx="40" fill={underlayColor} />
            <Rect x="16" y="16" width="80" height="80" rx="40" fill={backgroundColor} />
        </Svg>
    );
};
