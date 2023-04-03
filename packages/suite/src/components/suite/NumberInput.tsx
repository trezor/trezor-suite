import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { ControllerRenderProps, useController, UseControllerOptions } from 'react-hook-form';
import { Input, InputProps } from '@trezor/components';
import { TypedValidationRules } from '@suite-common/wallet-types';
import { localizeNumber } from '@suite-common/wallet-utils';
import { useSelector } from '@trezor/suite/src/hooks/suite';
import { Locale } from '@suite-config/languages';

const getLocaleSeparators = (locale: Locale) => {
    const numberFormat = new Intl.NumberFormat(locale);
    const parts = numberFormat.formatToParts(10000.1);

    const decimalSeparator = parts.find(({ type }) => type === 'decimal')?.value as string;
    const thousandsSeparator = parts.find(({ type }) => type === 'group')?.value as string;

    return { decimalSeparator, thousandsSeparator };
};

const getLocaleSeparatorCharCodes = (locale: Locale) => ({
    groupSeparatorCharCode: getLocaleSeparators(locale).thousandsSeparator.charCodeAt(0),
    decimalsSeparatorCharCode: getLocaleSeparators(locale).decimalSeparator.charCodeAt(0),
});

const cleanValueString = (value: string, locale: Locale) => {
    const { decimalSeparator, thousandsSeparator } = getLocaleSeparators(locale);

    const cleanedValue = value
        .replace(/\s/g, '')
        .replaceAll(thousandsSeparator, '')
        .replaceAll(decimalSeparator, '.');

    return cleanedValue;
};

const DECIMAL_SEPARATOR_CODES = [44, 46]; // [",", "."]

type TypedMethods = {
    field: Omit<ControllerRenderProps<Record<string, unknown>>, 'ref' | 'value'> & {
        value: string | undefined;
        ref?: React.RefObject<HTMLInputElement>;
    };
};

interface NumberInputProps extends Omit<InputProps, 'onChange' | 'type'> {
    name: string;
    rules?: TypedValidationRules;
    control: UseControllerOptions<Record<string, unknown>>['control'];
    decimalScale?: number;
    onChange?: (value: string) => void;
}

export const NumberInput = ({
    name,
    rules,
    control,
    onChange: onChangeCallback,
    defaultValue,
    ...props
}: NumberInputProps) => {
    const locale = useSelector(state => state.suite.settings.language);

    const {
        field: { value, onChange, ref: inputRef, ...controlProps },
    }: TypedMethods = useController<Record<string, unknown>>({
        name,
        control,
        rules: rules as UseControllerOptions<Record<string, unknown>>['rules'],
        defaultValue,
    });

    const [displayValue, setDisplayValue] = useState(localizeNumber(value || '', locale));

    const previousFormValueRef = useRef<string | undefined>(value);
    const previousDisplayValueRef = useRef(displayValue);

    // formats and sets the value visible in the input (not the form)
    const formatDisplayValue = useCallback(
        (value: string) => {
            const handleSetDisplayValue = (newDisplayValue: string) => {
                setDisplayValue(newDisplayValue);

                if (!inputRef.current) {
                    return;
                }

                previousDisplayValueRef.current = newDisplayValue;
                inputRef.current.value = newDisplayValue; // for setSelectionRange() working as intended

                return newDisplayValue;
            };

            // don't include spaces at the start or the end of a number, for pasting mainly
            value = value.trim();

            // don't localize when entering a separator or a 0 (e.g. 0.0000 -> 0.00001),
            // otherwise the separator might get removed
            const lastSymbolCode = value.at(-1)?.charCodeAt(0);
            const zeroCharCode = 48;
            if (
                lastSymbolCode &&
                [...DECIMAL_SEPARATOR_CODES, zeroCharCode].includes(lastSymbolCode)
            ) {
                // disallow entering more than one separator
                const secondToLastSymbolCode = value.at(-2)?.charCodeAt(0);
                if (
                    lastSymbolCode !== zeroCharCode &&
                    secondToLastSymbolCode &&
                    DECIMAL_SEPARATOR_CODES.includes(secondToLastSymbolCode)
                ) {
                    return;
                }

                // format a decimal separator to a locale-specific one to allow entering either one
                const { decimalsSeparatorCharCode } = getLocaleSeparatorCharCodes(locale);
                if (
                    DECIMAL_SEPARATOR_CODES.includes(lastSymbolCode) &&
                    lastSymbolCode !== decimalsSeparatorCharCode
                ) {
                    const { decimalSeparator } = getLocaleSeparators(locale);

                    // ignore additional decimal separators when a number is already a decimal
                    if (value.includes(decimalSeparator)) {
                        value = value.slice(0, -1);
                    } else {
                        value = value.slice(0, -1) + decimalSeparator;
                    }
                }

                // the number is incomplere and not reazy do be localized (e.g. 1,234. or 1,0000)
                return handleSetDisplayValue(value);
            }

            // clean so that it's compatible with Number() and localize
            const formattedNumber = localizeNumber(cleanValueString(value, locale), locale);
            return handleSetDisplayValue(formattedNumber);
        },
        [inputRef, locale],
    );

    useLayoutEffect(() => {
        const cleanPrevFormValue = cleanValueString(previousFormValueRef.current ?? '', locale);
        const cleanFormValue = cleanValueString(value ?? '', locale);
        const cleanPrevDisplayValue = cleanValueString(previousDisplayValueRef.current, locale);
        const cleanDisplayValue = cleanValueString(displayValue, locale);
        if (cleanPrevFormValue !== cleanFormValue && cleanPrevDisplayValue === cleanDisplayValue) {
            formatDisplayValue(value ?? '');
        }
    }, [formatDisplayValue, displayValue, value, locale]);

    const handleChange = useCallback(
        (inputValue: string) => {
            if (!inputRef.current) {
                return;
            }

            // make the string compliant with Number
            const cleanInput = cleanValueString(inputValue, locale);

            // allow inputs like '.031' or ',1' and disallow anything non-numerical
            if (
                !DECIMAL_SEPARATOR_CODES.includes(inputValue.charCodeAt(0)) &&
                Number.isNaN(Number(cleanInput))
            ) {
                return;
            }

            // read cursor position before formatting
            let { selectionStart } = inputRef.current;
            if (selectionStart === null) return;

            const { groupSeparatorCharCode } = getLocaleSeparatorCharCodes(locale);
            const previousDisplayValue = previousDisplayValueRef.current;

            // handle deleting a thousands separator with a DEL key (should not be possible with a Backspace),
            // otherwise the number instantly gets formatted back to having that separator
            if (inputValue.length < previousDisplayValue.length) {
                const deletedCharacterCode = previousDisplayValue.charCodeAt(selectionStart);
                // is not needed for nimbers without gropu separators (≤3 chars)
                if (deletedCharacterCode === groupSeparatorCharCode && inputValue.length > 3) {
                    inputValue =
                        previousDisplayValue.substring(0, selectionStart) +
                        previousDisplayValue.substring(selectionStart + 2);
                }
            }

            // format and set display value
            const currentValueLength = inputRef.current?.value.length || 0;
            const formattedValue = formatDisplayValue(inputValue);
            if (formattedValue === undefined) return;
            const formattedValueLength = formattedValue.length;

            // pass cleaned value to the form
            previousFormValueRef.current = cleanInput;
            onChange(cleanInput);
            onChangeCallback?.(cleanInput);

            // detect if separators have been added/removed
            // do not move the cursor in case of 123,456 => 1,123,456 (it moves 1 additional char if unhandled)
            const lengthDelta = formattedValueLength - currentValueLength;
            if (
                lengthDelta > 0 &&
                selectionStart !== 1 &&
                formattedValue.charCodeAt(selectionStart) !== groupSeparatorCharCode
            ) {
                selectionStart += lengthDelta;
                // do not move the cursor if it was at the beginning already
            } else if (lengthDelta < 0 && selectionStart !== 0) {
                selectionStart += lengthDelta;
            }

            // make sure the cursor stays in the right place after formatting
            inputRef.current.setSelectionRange(selectionStart, selectionStart);
        },
        [formatDisplayValue, locale, onChange, onChangeCallback, inputRef],
    );

    // copy the non-formatted value
    const handleCopy = useCallback(
        (e: React.ClipboardEvent<HTMLInputElement>) => {
            e.clipboardData.setData('text/plain', cleanValueString(displayValue, locale));

            e.preventDefault();
        },
        [displayValue, locale],
    );

    // cut the non-formatted value and manually clear the input
    const handleCut = useCallback(
        (e: React.ClipboardEvent<HTMLInputElement>) => {
            handleCopy(e);
            handleChange('');
        },
        [handleCopy, handleChange],
    );

    // only allow digits and separators
    const handleOnBeforeInput = useCallback(
        (e: React.FormEvent<HTMLInputElement> & { data: string }) => {
            if (/[\d.,]/g.test(e.data)) {
                return;
            }

            e.preventDefault();
        },
        [],
    );

    // checks for separators at pos + cursorCharacterOffset and moves the cursor to pos + cursorPositionOffset
    const handleCursorShift = useCallback(
        (cursorCharacterOffset: number, cursorPositionOffset: number) => {
            if (!inputRef.current) {
                return;
            }

            const { selectionStart: cursorPosition, selectionEnd, value } = inputRef.current;
            if (cursorPosition === null || cursorPosition !== selectionEnd) {
                return;
            }

            const { groupSeparatorCharCode } = getLocaleSeparatorCharCodes(locale);
            const characterBeforeCursor = value[cursorPosition + cursorCharacterOffset];

            if (characterBeforeCursor?.charCodeAt(0) === groupSeparatorCharCode) {
                const newPosition = cursorPosition + cursorPositionOffset;
                inputRef.current.setSelectionRange(newPosition, newPosition);
            }
        },
        [inputRef, locale],
    );

    // do not allow putting the cursor after group separators
    const handleClick = useCallback(() => {
        handleCursorShift(-1, -1);
    }, [handleCursorShift]);

    // jump over group separators when navigatind the input
    const handleKeyNav = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            const pressedKey = e.key;

            if (pressedKey === 'ArrowRight') handleCursorShift(0, 1);
            if (pressedKey === 'ArrowLeft') handleCursorShift(-2, -1);
        },
        [handleCursorShift],
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            const pressedKey = e.key;

            if (['ArrowLeft', 'ArrowRight'].includes(pressedKey)) {
                handleKeyNav(e);

                return;
            }

            // undo doesn't work properly so better disallow it altogether
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
            }
        },
        [handleKeyNav],
    );

    return (
        <Input
            {...props}
            {...controlProps}
            innerRef={inputRef}
            value={displayValue}
            inputMode="decimal"
            onSelect={handleClick}
            onKeyDown={handleKeyDown}
            onBeforeInput={handleOnBeforeInput}
            onChange={e => handleChange(e.target.value)}
            onCopy={handleCopy}
            onCut={handleCut}
        />
    );
};
