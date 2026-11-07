import { BigNumber } from '@trezor/utils';

export type TxSimulationFiatPrefix = '+' | '-';

// Matches the default fraction digits of BaseCurrencyAmountFormatter.
const FIAT_FRACTION_DIGITS = 2;

/**
 * A dust outflow would otherwise read as "-$0.00", so a fiat value that rounds to zero is shown
 * as approximate instead.
 */
export const getTxSimulationFiatPrefix = (
    value: string,
    prefix: TxSimulationFiatPrefix | undefined,
) => {
    const isRoundedToZero = new BigNumber(value)
        .decimalPlaces(FIAT_FRACTION_DIGITS, BigNumber.ROUND_HALF_UP)
        .isZero();

    return prefix === '-' && isRoundedToZero ? '≈' : prefix;
};
