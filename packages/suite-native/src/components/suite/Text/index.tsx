import React from 'react';
import { Text as RNText, TextProps } from 'react-native';
import { useTheme } from '@suite-hooks';
import styles from '@native/support/suite/styles';

interface Props extends TextProps {
    variant?: 'primary' | 'secondary';
    children?: React.ReactNode;
}

const Text = ({ variant = 'primary', style, children }: Props) => {
    const { theme } = useTheme();
    const baseStyle =
        variant === 'primary' ? styles(theme).primaryText : styles(theme).secondaryText;

    return <RNText style={[baseStyle, style]}>{children}</RNText>;
};

export default Text;
