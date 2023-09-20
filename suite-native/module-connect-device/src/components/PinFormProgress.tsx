import { Box, HStack, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { useFormContext } from '@suite-native/forms';

const MAX_DIGITS_DISPLAYED_AS_DOTS = 6;

const dotStyle = prepareNativeStyle(utils => ({
    width: utils.spacings.small,
    height: utils.spacings.small,
    borderRadius: utils.borders.radii.round,
    borderColor: utils.colors.textDefault,
    borderWidth: utils.borders.widths.small,
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
    const { watch } = useFormContext();

    const pinLength = watch('pin').length;

    if (!pinLength) return <Text variant="titleSmall">Enter PIN</Text>;

    if (pinLength > MAX_DIGITS_DISPLAYED_AS_DOTS)
        return (
            <Text style={applyStyle(enteredDigitsStyle)} color="textSubdued">
                Entered <Text variant="highlight">{pinLength}</Text> digits
            </Text>
        );

    // Create array of digits indexes, so we map them for dots to be displayed.
    const progress = Array.from({ length: pinLength }, (_, index) => index);

    const getMapKey = (index: number) => `pin-progress-${index}`;

    return (
        <HStack justifyContent="center">
            {progress.map((_, index) => (
                <Box style={applyStyle(dotStyle)} key={getMapKey(index)} />
            ))}
        </HStack>
    );
};
