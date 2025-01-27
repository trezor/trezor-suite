import { LinearGradient } from 'expo-linear-gradient';

import { hexToRgba } from '@suite-common/suite-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const screenFooterGradientStyle = prepareNativeStyle(utils => ({
    width: '100%',
    height: utils.spacings.sp16,
    top: -utils.spacings.sp16,
    marginBottom: -utils.spacings.sp16,
    pointerEvents: 'none',
}));

export const ScreenFooterGradient = () => {
    const { applyStyle, utils } = useNativeStyles();

    // 'transparent' color does not work in context of LinearGradient on iOS, RGBA has to be used instead.
    const backgroundColor = utils.colors.backgroundSurfaceElevation0;
    const transparentColor = hexToRgba(backgroundColor, 0.01);

    return (
        <LinearGradient
            dither={false}
            colors={[transparentColor, backgroundColor]}
            style={applyStyle(screenFooterGradientStyle)}
        />
    );
};
