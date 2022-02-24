import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { SuiteThemeColors } from '../../../support/types';
import { useTheme } from '../../../utils/hooks';

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
    children?: React.ReactNode;
}

const P = ({ variant = 'primary', style, children }: Props) => {
    const theme = useTheme();
    const baseStyle =
        variant === 'primary' ? styles(theme).primaryText : styles(theme).secondaryText;

    return <Text style={[baseStyle, style]}>{children}</Text>;
};

export { P };
