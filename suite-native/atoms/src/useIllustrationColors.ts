import { useNativeStyles } from '@trezor/styles-native';

export const useIllustrationColors = () => {
    const {
        utils: { colors },
    } = useNativeStyles();

    const lineColor = colors.backgroundPrimaryDefault;
    const fillColor = colors.illustrationFillBrand;

    return { lineColor, fillColor };
};
