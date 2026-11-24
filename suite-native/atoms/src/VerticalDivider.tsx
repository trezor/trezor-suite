import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { Box } from './Box';

const dividerStyle = prepareNativeStyle(({ borders, colors }) => ({
    borderLeftWidth: borders.widths.small,
    borderLeftColor: colors.borderNeutral,
}));

export const VerticalDivider = () => {
    const { applyStyle } = useNativeStyles();

    return <Box style={applyStyle(dividerStyle)} />;
};
