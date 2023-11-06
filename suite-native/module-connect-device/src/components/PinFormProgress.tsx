import { Box, HStack, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { useFormContext } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';

const MAX_DIGITS_DISPLAYED_AS_DOTS = 6;

const dotStyle = prepareNativeStyle(utils => ({
    width: utils.spacings.s,
    height: utils.spacings.s,
    borderRadius: utils.borders.radii.round,
    borderColor: utils.colors.textDefault,
    borderWidth: utils.borders.widths.s,
    backgroundColor: utils.colors.textDefault,
}));

const enteredDigitsStyle = prepareNativeStyle(utils => ({
    borderRadius: utils.borders.radii.round,
    backgroundColor: utils.colors.backgroundSurfaceElevation0,
    borderColor: utils.colors.borderOnElevation0,
    paddingHorizontal: utils.spacings.medium,
}));

export const PinFormProgress = () => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();
    const { watch } = useFormContext();

    const pinLength = watch('pin').length;

    if (!pinLength)
        return (
            <Text variant="titleSmall">
                {translate('moduleConnectDevice.pinScreen.form.title')}
            </Text>
        );

    if (pinLength > MAX_DIGITS_DISPLAYED_AS_DOTS)
        return (
            <Box flexDirection="row" style={applyStyle(enteredDigitsStyle)}>
                <Text color="textSubdued">
                    {translate('moduleConnectDevice.pinScreen.form.entered')}{' '}
                </Text>
                <Text variant="highlight">{pinLength}</Text>
                <Text color="textSubdued">
                    {' '}
                    {translate('moduleConnectDevice.pinScreen.form.digits')}
                </Text>
            </Box>
        );

    // Create array of digits indexes, so we map them for dots to be displayed.
    const progress = Array.from({ length: pinLength }, (_, index) => index);

    return (
        <HStack justifyContent="center">
            {progress.map((_, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <Box style={applyStyle(dotStyle)} key={index} />
            ))}
        </HStack>
    );
};
