import { LinearGradient } from 'expo-linear-gradient';

import { type NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { hexToRgba } from '@trezor/utils';

const screenFooterGradientStyle = prepareNativeStyle(utils => ({
    width: '100%',
    height: utils.spacings.sp16,
    top: -utils.spacings.sp16,
    marginBottom: -utils.spacings.sp16,
    pointerEvents: 'none',
}));
type ScreenFooterGradientProps = {
    style?: NativeStyleObject;
};
export const ScreenFooterGradient = ({ style }: ScreenFooterGradientProps) => {
    const { applyStyle, utils } = useNativeStyles();

    // 'transparent' color does not work in context of LinearGradient on iOS, RGBA has to be used instead.
    const backgroundColor = utils.colors.surfaceFillPage;
    const transparentColor = hexToRgba(backgroundColor, 0.1);

    return (
        <LinearGradient
            dither={false}
            colors={[transparentColor, backgroundColor]}
            style={[applyStyle(screenFooterGradientStyle), style]}
        />
    );
};
