import React from 'react';
import { View, Text, StyleSheet, ButtonProps, TouchableWithoutFeedback } from 'react-native';
import { SuiteThemeColors } from '../../../support/types';
import { useTheme } from '../../../utils/hooks';

const styles = (theme: SuiteThemeColors) =>
    StyleSheet.create({
        button: {
            backgroundColor: theme.BG_GREEN,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 4,
            paddingVertical: 8,
            paddingHorizontal: 24,
        },
        buttonText: {
            color: theme.TYPE_WHITE,
            fontSize: 16,
        },
    });

interface Props {
    onClick: ButtonProps['onPress'];
    children?: React.ReactNode;
}

const Button = (props: Props) => {
    const theme = useTheme();
    return (
        <TouchableWithoutFeedback onPress={props.onClick}>
            <View style={styles(theme).button}>
                <Text style={styles(theme).buttonText}>{props.children}</Text>
            </View>
        </TouchableWithoutFeedback>
    );
};

export { Button, ButtonProps };
