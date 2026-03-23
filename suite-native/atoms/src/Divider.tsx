import {
    type NativeStyleObject,
    mergeNativeStyleObjects,
    prepareNativeStyle,
    useNativeStyles,
} from '@trezor/styles';
import { isNotNullOrUndefined } from '@trezor/utils';

import { Box, type BoxProps } from './Box';

export type DividerProps = Omit<BoxProps, 'style'> & {
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

    const mergedStyle = isNotNullOrUndefined(style)
        ? mergeNativeStyleObjects([defaultStyle, style])
        : defaultStyle;

    return <Box style={mergedStyle} {...props} />;
};
