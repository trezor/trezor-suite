import { Box, HStack, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { useFormContext } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';

import { useAtomValue } from 'jotai';

import { isPinFormSubmittingAtom } from '../isPinFormSubmittingAtom';

const MAX_DIGITS_DISPLAYED_AS_DOTS = 6;

const dotStyle = prepareNativeStyle<{ isPinFormSubmitting: boolean }>(
    (utils, { isPinFormSubmitting }) => {
        const color = isPinFormSubmitting ? utils.colors.textDisabled : utils.colors.textDefault;
        return {
            width: utils.spacings.small,
            height: utils.spacings.small,
            borderRadius: utils.borders.radii.round,
            borderColor: color,
            borderWidth: utils.borders.widths.small,
            backgroundColor: color,
        };
    },
);

const enteredDigitsStyle = prepareNativeStyle(utils => ({
    borderRadius: utils.borders.radii.round,
    backgroundColor: utils.colors.backgroundSurfaceElevation0,
    borderColor: utils.colors.borderOnElevation0,
    paddingHorizontal: utils.spacings.medium,
}));

export const PinFormProgress = () => {
    const isPinFormSubmitting = useAtomValue(isPinFormSubmittingAtom);
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();
    const { watch } = useFormContext();

    const pinLength = watch('pin').length;

    if (!pinLength) {
        return (
            <Text variant="titleSmall">
                {translate('moduleConnectDevice.pinScreen.form.title')}
            </Text>
        );
    }

    if (pinLength > MAX_DIGITS_DISPLAYED_AS_DOTS) {
        const color = isPinFormSubmitting ? 'textDisabled' : 'textSubdued';
        return (
            <Box flexDirection="row" style={applyStyle(enteredDigitsStyle)}>
                <Text color={color}>
                    {translate('moduleConnectDevice.pinScreen.form.entered')}{' '}
                </Text>
                <Text variant="highlight">{pinLength}</Text>
                <Text color={color}> {translate('moduleConnectDevice.pinScreen.form.digits')}</Text>
            </Box>
        );
    }

    // Create array of digits indexes, so we map them for dots to be displayed.
    const progress = Array.from({ length: pinLength }, (_, index) => index);

    return (
        <HStack justifyContent="center">
            {progress.map((_, index) => (
                <Box style={applyStyle(dotStyle, { isPinFormSubmitting })} key={index} />
            ))}
        </HStack>
    );
};
