import { Hint } from '@suite-native/atoms';
import { useField } from '@suite-native/forms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { getOutputFieldName } from '../utils';

const MESSAGE_DEFAULT_OFFSET = 110;
const MESSAGE_FIATLESS_OFFSET = 62;

const errorStyle = prepareNativeStyle<{ isFiatDisplayed: boolean }>((_, { isFiatDisplayed }) => ({
    position: 'absolute',
    top: isFiatDisplayed ? MESSAGE_DEFAULT_OFFSET : MESSAGE_FIATLESS_OFFSET,
}));

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
    const { isDirty, errorMessage } = amountField;

    if (!isDirty || !errorMessage) return null;

    return (
        <Hint variant="error" style={applyStyle(errorStyle, { isFiatDisplayed })}>
            {errorMessage}
        </Hint>
    );
};
