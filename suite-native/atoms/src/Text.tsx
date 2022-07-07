import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';

import { useNativeStyles, prepareNativeStyle, NativeStyleObject } from '@trezor/styles';
import { Color, TypographyStyle } from '@trezor/theme';

interface TextProps extends Omit<RNTextProps, 'style'> {
    variant?: TypographyStyle;
    color?: Color;
    align?: TextStyle['textAlign'];
    style?: NativeStyleObject;
}

type TextStyleProps = {
    variant: TypographyStyle;
    color: Color;
    align: TextStyle['textAlign'];
};

const textStyle = prepareNativeStyle<TextStyleProps>((utils, { variant, color, align }) => ({
    ...utils.typography[variant],
    color: utils.colors[color],
    textAlign: align,
}));

export const Text = ({
    variant = 'body',
    color = 'black',
    align = 'left',
    style,
    ...otherProps
}: TextProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <RNText style={[applyStyle(textStyle, { variant, color, align }), style]} {...otherProps} />
    );
};
