import { Hint } from '@suite-native/atoms';
import { useField } from '@suite-native/forms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { getOutputFieldName } from '../utils';

const errorStyle = prepareNativeStyle<{ isFiatDisplayed: boolean }>(
    (utils, { isFiatDisplayed }) => ({
        marginHorizontal: isFiatDisplayed ? utils.spacings.sp16 : 0,
    }),
);

export const AmountErrorMessage = ({
    outputIndex,
    isFiatDisplayed,
}: {
    outputIndex: number;
    isFiatDisplayed: boolean;
}) => {
    const { applyStyle } = useNativeStyles();
    const amountField = useField({
        name: getOutputFieldName(outputIndex, 'amount'),
    });
    const { errorMessage } = amountField;

    if (!errorMessage) return null;

    return (
        <Hint variant="error" style={applyStyle(errorStyle, { isFiatDisplayed })}>
            {errorMessage}
        </Hint>
    );
};
