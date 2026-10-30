import { type ReactNode } from 'react';

import { Text, type TextProps, resetLetterSpacingOnAndroidStyle } from '@suite-native/atoms';
import { mergeNativeStyleObjects, useNativeStyles } from '@trezor/styles-native';

export type AmountTextProps = {
    value: ReactNode;
} & TextProps;

export const AmountText = ({
    value,
    color = 'contentPrimary',
    style = {},
    ...otherProps
}: AmountTextProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Text
            testID="plain-text"
            color={color}
            style={mergeNativeStyleObjects([style, applyStyle(resetLetterSpacingOnAndroidStyle)])}
            {...otherProps}
        >
            {value}
        </Text>
    );
};
