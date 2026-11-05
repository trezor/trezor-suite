import { getLocaleSeparators, localizeNumber } from '@trezor/utils';

export type AmountSeparators = {
    decimalSeparator: string;
    thousandsSeparator: string;
};

export type AmountLimits = {
    maxDecimals?: number;
    maxLength?: number;
};

type GetEditedRawAmountParams = {
    previousDisplayedAmount: string;
    nextDisplayedAmount: string;
    separators: AmountSeparators;
    limits: AmountLimits;
};

type GetDisplayMaxLengthParams = {
    displayedAmount: string;
    decimalSeparator: string;
    maxDecimals?: number;
};

const RAW_DECIMAL_SEPARATOR = '.';
const KEYPAD_DECIMAL_SEPARATORS = [',', '.'];
const RAW_AMOUNT_REGEX = /^\d*\.?\d*$/;

export const formatRawAmount = (rawAmount: string, locale: string) => {
    const [integerPart = '', fractionalPart] = rawAmount.split(RAW_DECIMAL_SEPARATOR);
    const localizedIntegerPart = localizeNumber(integerPart, locale);

    if (fractionalPart === undefined) {
        return localizedIntegerPart;
    }

    const { decimalSeparator } = getLocaleSeparators(locale);

    return `${localizedIntegerPart}${decimalSeparator}${fractionalPart}`;
};

const parseDisplayedAmount = (
    displayedAmount: string,
    { decimalSeparator, thousandsSeparator }: AmountSeparators,
) =>
    displayedAmount
        .replaceAll(thousandsSeparator, '')
        .replaceAll(decimalSeparator, RAW_DECIMAL_SEPARATOR);

export const parsePastedAmount = (
    pastedText: string,
    { decimalSeparator, thousandsSeparator }: AmountSeparators,
) => {
    const keypadGroupSeparator = decimalSeparator === ',' ? '.' : ',';

    return pastedText
        .replace(/\s/g, '')
        .replaceAll(thousandsSeparator, '')
        .replaceAll(keypadGroupSeparator, '')
        .replaceAll(decimalSeparator, RAW_DECIMAL_SEPARATOR);
};

const isTypedDecimalSeparator = (text: string, decimalSeparator: string) =>
    text === decimalSeparator || KEYPAD_DECIMAL_SEPARATORS.includes(text);

const parseAppendedText = (appendedText: string, separators: AmountSeparators) =>
    isTypedDecimalSeparator(appendedText, separators.decimalSeparator)
        ? RAW_DECIMAL_SEPARATOR
        : parsePastedAmount(appendedText, separators);

const normalizeRawAmount = (rawAmount: string) => {
    const rawAmountWithIntegerPart = rawAmount.startsWith(RAW_DECIMAL_SEPARATOR)
        ? `0${rawAmount}`
        : rawAmount;

    return rawAmountWithIntegerPart.replace(/^0+(?=\d)/, '');
};

const isWithinAmountLimits = (rawAmount: string, { maxDecimals, maxLength }: AmountLimits) => {
    const [, fractionalPart] = rawAmount.split(RAW_DECIMAL_SEPARATOR);
    const isDecimalAmount = fractionalPart !== undefined;

    const isWithinMaxLength = maxLength === undefined || rawAmount.length <= maxLength;
    const isDecimalAmountAllowed = !isDecimalAmount || maxDecimals !== 0;
    const isWithinMaxDecimals =
        !isDecimalAmount || maxDecimals === undefined || fractionalPart.length <= maxDecimals;

    return isWithinMaxLength && isDecimalAmountAllowed && isWithinMaxDecimals;
};

export const getEditedRawAmount = ({
    previousDisplayedAmount,
    nextDisplayedAmount,
    separators,
    limits,
}: GetEditedRawAmountParams): string | null => {
    const isDeletedFromEnd = previousDisplayedAmount.startsWith(nextDisplayedAmount);
    if (isDeletedFromEnd) {
        return parseDisplayedAmount(nextDisplayedAmount, separators);
    }

    const isAppended = nextDisplayedAmount.startsWith(previousDisplayedAmount);
    if (!isAppended) {
        return null;
    }

    const appendedText = nextDisplayedAmount.slice(previousDisplayedAmount.length);
    const rawAmount = normalizeRawAmount(
        parseDisplayedAmount(previousDisplayedAmount, separators) +
            parseAppendedText(appendedText, separators),
    );

    const isAcceptedAmount =
        RAW_AMOUNT_REGEX.test(rawAmount) && isWithinAmountLimits(rawAmount, limits);

    return isAcceptedAmount ? rawAmount : null;
};

export const getDisplayMaxLength = ({
    displayedAmount,
    decimalSeparator,
    maxDecimals,
}: GetDisplayMaxLengthParams) => {
    const decimalSeparatorIndex = displayedAmount.indexOf(decimalSeparator);
    if (decimalSeparatorIndex === -1 || maxDecimals === undefined) {
        return undefined;
    }

    const maxLengthWithAllowedDecimals =
        decimalSeparatorIndex + decimalSeparator.length + maxDecimals;

    return Math.max(displayedAmount.length, maxLengthWithAllowedDecimals);
};
