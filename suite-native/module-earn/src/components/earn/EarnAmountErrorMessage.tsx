import { Hint } from '@suite-native/atoms';
import { useField } from '@suite-native/forms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { SOLANA_UNSTAKE_AMOUNT_BOUNDS_ERROR } from '../../utils/staking/unstakeFormSchema';

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
    const { errorMessage, errorType } = useField({ name: 'amount' });

    if (!errorMessage || errorType === SOLANA_UNSTAKE_AMOUNT_BOUNDS_ERROR) return null;

    return (
        <Hint variant="error" style={applyStyle(errorStyle, { isFiatDisplayed })}>
            {errorMessage}
        </Hint>
    );
};
