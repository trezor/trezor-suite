import { StyleSheet, TextStyle } from 'react-native';

const colors = {
    text: '#333',
};

type Colors = typeof colors;

const baseFontSize = 16;
const baseLineHeight = 24;

class Theme {
    text: TextStyle;
    // container: ViewStyle;

    // TODO: https://medium.com/react-native-training/react-native-custom-fonts-ccc9aacf9e5e
    constructor(colors: Colors) {
        this.text = {
            // fontFamily:
            //    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
            fontSize: baseFontSize,
            lineHeight: baseLineHeight,
            color: colors.text,
        };

        // this.container = {
        //   width: 123,
        //   color: 'red'
        // }
    }
}

export const lightTheme = StyleSheet.create(new Theme(colors));
