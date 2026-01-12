import { useNativeStyles } from '@trezor/styles';

export const useIllustrationColors = () => {
    const {
        utils: { colors },
    } = useNativeStyles();

    const lineColor = colors.backgroundPrimaryDefault;
    const fillColor = colors.illustrationFillBrand;

    return { lineColor, fillColor };
};
