import { BigNumber } from '@trezor/utils';

import { makeFormatter } from '../makeFormatter';
import { type FormatterConfig } from '../types';

export type PercentageFormatterDataContext = { withSymbol?: boolean };

const MAXIMUM_FRACTION_DIGITS = 2;

export const preparePercentageFormatter = ({ intl }: FormatterConfig) =>
    makeFormatter<number, string, PercentageFormatterDataContext>(
        (value, { withSymbol = false }) => {
            const rounded = new BigNumber(value).decimalPlaces(
                MAXIMUM_FRACTION_DIGITS,
                BigNumber.ROUND_HALF_UP,
            );

            return withSymbol
                ? intl.formatNumber(rounded.dividedBy(100).toNumber(), {
                      style: 'percent',
                      maximumFractionDigits: MAXIMUM_FRACTION_DIGITS,
                  })
                : intl.formatNumber(rounded.toNumber(), {
                      maximumFractionDigits: MAXIMUM_FRACTION_DIGITS,
                  });
        },
        'PercentageFormatter',
    );
