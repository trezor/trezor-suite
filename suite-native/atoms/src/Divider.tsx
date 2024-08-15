import { G } from '@mobily/ts-belt';

import {
    NativeStyleObject,
    mergeNativeStyleObjects,
    prepareNativeStyle,
    useNativeStyles,
} from '@trezor/styles';

import { Box, BoxProps } from './Box';

type DividerProps = Omit<BoxProps, 'style'> & {
    style?: NativeStyleObject;
};

const dividerStyle = prepareNativeStyle(utils => ({
    borderBottomWidth: utils.borders.widths.small,
    borderBottomColor: utils.colors.borderElevation1,
    flex: 1,
}));

export const Divider = ({ style, ...props }: DividerProps) => {
    const { applyStyle } = useNativeStyles();

    const defaultStyle = applyStyle(dividerStyle);

    const mergedStyle = G.isNotNullable(style)
        ? mergeNativeStyleObjects([defaultStyle, style])
        : defaultStyle;

    return <Box style={mergedStyle} {...props} />;
};
