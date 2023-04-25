import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';

import { useNativeStyles, prepareNativeStyle, NativeStyleObject } from '@trezor/styles';
import { Color, TypographyStyle } from '@trezor/theme';

import { TestProps } from './types';

export interface TextProps extends Omit<RNTextProps, 'style'>, TestProps {
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
    color = 'textDefault',
    align = 'left',
    style,
    children,
    ...otherProps
}: TextProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <RNText style={[applyStyle(textStyle, { variant, color, align }), style]} {...otherProps}>
            {children}
        </RNText>
    );
};
