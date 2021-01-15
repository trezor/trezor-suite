import { StyleSheet } from 'react-native';
import { SuiteThemeColors } from '@suite-types';

const styles = (theme: SuiteThemeColors) =>
    StyleSheet.create({
        safeArea: {
            flex: 1,
            backgroundColor: theme.BG_WHITE,
        },
        container: {
            // flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.BG_WHITE,
        },
        primaryText: {
            color: theme.TYPE_DARK_GREY,
        },
        secondaryText: {
            color: theme.TYPE_LIGHT_GREY,
        },
        h1: {
            fontWeight: 'bold',
            fontSize: 20,
        },
        button: {
            marginTop: '10px',
            marginBottom: '1px',
            padding: 20,
            backgroundColor: 'green',
        },
    });

export default styles;
