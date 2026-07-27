import { type ReactNode } from 'react';

import { Box, HStack, Text } from '@suite-native/atoms';
import { useFormContext } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const MAX_DIGITS_DISPLAYED_AS_DOTS = 6;

const dotStyle = prepareNativeStyle<{ isSubmitted: boolean }>((utils, { isSubmitted }) => {
    const color = isSubmitted ? utils.colors.contentDisabled : utils.colors.contentPrimary;

    return {
        width: utils.spacings.sp8,
        height: utils.spacings.sp8,
        borderRadius: utils.borders.radii.round,
        borderColor: color,
        borderWidth: utils.borders.widths.small,
        backgroundColor: color,
    };
});

const enteredDigitsStyle = prepareNativeStyle(utils => ({
    borderRadius: utils.borders.radii.round,
    backgroundColor: utils.colors.surfaceFillPage,
    borderColor: utils.colors.borderNeutral,
    paddingHorizontal: utils.spacings.sp16,
}));

type PinFormProgressProps = {
    title: ReactNode;
};

export const PinFormProgress = ({ title }: PinFormProgressProps) => {
    const { applyStyle } = useNativeStyles();
    const {
        watch,
        formState: { isSubmitted },
    } = useFormContext();

    const pinLength = watch('pin').length;

    if (!pinLength) {
        return <Text variant="headline-sm">{title}</Text>;
    }

    if (pinLength > MAX_DIGITS_DISPLAYED_AS_DOTS) {
        const color = isSubmitted ? 'contentDisabled' : 'contentSecondary';

        return (
            <Box flexDirection="row" style={applyStyle(enteredDigitsStyle)}>
                <Text color={color}>
                    <Translation id="moduleConnectDevice.pinScreen.form.entered" />{' '}
                </Text>
                <Text variant="body-md-strong">{pinLength}</Text>
                <Text color={color}>
                    {' '}
                    <Translation id="moduleConnectDevice.pinScreen.form.digits" />
                </Text>
            </Box>
        );
    }

    // Create array of digits indexes, so we map them for dots to be displayed.
    const progress = Array.from({ length: pinLength }, (_, index) => index);

    return (
        <HStack justifyContent="center">
            {progress.map((_, index) => (
                <Box style={applyStyle(dotStyle, { isSubmitted })} key={index} />
            ))}
        </HStack>
    );
};
