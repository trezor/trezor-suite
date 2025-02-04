import { Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const dividerStyle = prepareNativeStyle(({ borders, colors }) => ({
    height: borders.widths.small,
    backgroundColor: colors.backgroundSurfaceElevation0,
}));

export const TradingRowDivider = () => {
    const { applyStyle } = useNativeStyles();

    return <Box style={applyStyle(dividerStyle)} />;
};
