import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box, BoxProps } from './Box';

const dividerStyle = prepareNativeStyle(utils => ({
    borderBottomWidth: utils.borders.widths.small,
    borderBottomColor: utils.colors.borderElevation1,
    flex: 1,
}));

export const Divider = ({ ...props }: BoxProps) => {
    const { applyStyle } = useNativeStyles();

    return <Box style={applyStyle(dividerStyle)} {...props} />;
};
