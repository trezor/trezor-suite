import { type CryptoAmountFormatterFormatStyle } from '@suite-common/formatters';
import { type TextProps } from '@suite-native/atoms';

export type AmountFormatterCommonProps = {
    /** Controls precision and compact balance formatting. Defaults to `exact`. */
    formatStyle?: CryptoAmountFormatterFormatStyle;
    /** Hides the numerical value when discreet mode is active. Defaults to `true`. */
    isDiscreetText?: boolean;
    /** Hides the numerical value regardless of the global discreet-mode setting. */
    isForcedDiscreetMode?: boolean;
    /** Renders an amount skeleton instead of the formatted value. */
    isLoading?: boolean;
    /** Caps decimal places in exact format. */
    maxDisplayedDecimals?: number;
    /** Prefixes the formatted value with a sign. */
    sign?: '+' | '-' | null;
} & TextProps;
