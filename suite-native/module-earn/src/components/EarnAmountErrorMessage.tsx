import { Hint } from '@suite-native/atoms';
import { useField } from '@suite-native/forms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const errorStyle = prepareNativeStyle<{ isFiatDisplayed: boolean }>(
    (utils, { isFiatDisplayed }) => ({
        marginHorizontal: 0,
        extend: {
            condition: isFiatDisplayed,
            style: {
                marginHorizontal: utils.spacings.sp16,
            },
        },
    }),
);

export const EarnAmountErrorMessage = ({ isFiatDisplayed }: { isFiatDisplayed: boolean }) => {
    const { applyStyle } = useNativeStyles();
    const { errorMessage } = useField({ name: 'amount' });

    if (!errorMessage) return null;

    return (
        <Hint variant="error" style={applyStyle(errorStyle, { isFiatDisplayed })}>
            {errorMessage}
        </Hint>
    );
};
