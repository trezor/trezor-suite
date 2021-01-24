import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { RN_FONT_SIZE } from '../../../config/variables';
import { SuiteThemeColors } from '../../../support/types';
import { useTheme } from '../../../utils/hooks';

const styles = (theme: SuiteThemeColors) =>
    StyleSheet.create({
        common: {
            color: theme.TYPE_DARK_GREY,
            fontWeight: 'bold',
        },
        h1: {
            fontSize: RN_FONT_SIZE.H1,
        },
        h2: {
            fontSize: RN_FONT_SIZE.H2,
        },
    });

interface Props extends TextProps {
    variant?: 'h1' | 'h2';
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    children?: React.ReactNode;
}

const Heading = ({ variant = 'h1', textAlign, style, children }: Props) => {
    const theme = useTheme();
    const baseStyle = styles(theme).common;
    const hStyle = variant === 'h1' ? styles(theme).h1 : styles(theme).h2;

    return (
        <Text style={[baseStyle, hStyle, textAlign ? { textAlign } : undefined, style]}>
            {children}
        </Text>
    );
};

const H2 = (props: Props) => <Heading variant="h2" {...props} />;

export { Heading as H1, H2 };
