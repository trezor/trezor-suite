import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box, BoxProps } from './Box';

const dividerStyle = prepareNativeStyle(utils => ({
    borderBottomWidth: utils.borders.widths.s,
    borderBottomColor: utils.colors.borderFocus,
    flex: 1,
}));

export const Divider = ({ ...props }: BoxProps) => {
    const { applyStyle } = useNativeStyles();

    return <Box style={applyStyle(dividerStyle)} {...props} />;
};
