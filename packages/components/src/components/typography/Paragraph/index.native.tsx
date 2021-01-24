import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { RN_FONT_SIZE } from '../../../config/variables';
import { SuiteThemeColors } from '../../../support/types';
import { useTheme } from '../../../utils/hooks';

const P_SIZES = {
    normal: RN_FONT_SIZE.NORMAL,
    small: RN_FONT_SIZE.SMALL,
    tiny: RN_FONT_SIZE.TINY,
    h1: RN_FONT_SIZE.H1,
    h2: RN_FONT_SIZE.H2,
} as const;

const styles = (theme: SuiteThemeColors) =>
    StyleSheet.create({
        primaryText: {
            color: theme.TYPE_DARK_GREY,
        },
        secondaryText: {
            color: theme.TYPE_LIGHT_GREY,
        },
    });

interface Props extends TextProps {
    variant?: 'primary' | 'secondary';
    size?: keyof typeof P_SIZES;
    children?: React.ReactNode;
}

const P = ({ variant = 'primary', size = 'normal', style, children }: Props) => {
    const theme = useTheme();
    const baseStyle =
        variant === 'primary' ? styles(theme).primaryText : styles(theme).secondaryText;

    return (
        <Text
            style={[
                baseStyle,
                {
                    fontSize: P_SIZES[size],
                },
                style,
            ]}
        >
            {children}
        </Text>
    );
};

export { P, Props as PProps };
