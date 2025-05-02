import { useNativeStyles } from '@trezor/styles';

export const useIllustrationColors = () => {
    const { utils } = useNativeStyles();
    const lineColor = utils.colors.backgroundPrimaryDefault;
    const fillColor = utils.colors.backgroundSurfaceElevation0;

    return { lineColor, fillColor };
};
