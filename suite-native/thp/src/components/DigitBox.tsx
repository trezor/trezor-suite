import { Platform } from 'react-native';

import { Box, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type DigitBoxProps = {
    value?: string;
    isFocused: boolean;
    testID?: string;
};

const digitBoxStyle = prepareNativeStyle<{ isFocused: boolean }>(
    ({ colors, borders }, { isFocused }) => ({
        margin: isFocused ? 0 : borders.widths.small,
        borderColor: isFocused ? colors.borderInputFocus : colors.borderInputDefault,
        borderWidth: isFocused ? borders.widths.large : borders.widths.small,
        borderRadius: borders.radii.r12,
        backgroundColor: colors.backgroundNeutralSubtleOnElevation0,
        justifyContent: 'center',
    }),
);

const digitStyle = prepareNativeStyle(utils => ({
    width: 48,
    height: 56,
    ...utils.typography['headline-md'],
    // TODO: Is there a better way?
    lineHeight: Platform.OS === 'ios' ? 62 : 56, // centers the digit vertically
    letterSpacing: 0, // fixes slight horizontal offset from the center
    textAlign: 'center',
    color: utils.colors.textDefault,
}));

export const DigitBox = ({ value, isFocused }: DigitBoxProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(digitBoxStyle, { isFocused })}>
            <Text style={applyStyle(digitStyle)}>{value}</Text>
        </Box>
    );
};
