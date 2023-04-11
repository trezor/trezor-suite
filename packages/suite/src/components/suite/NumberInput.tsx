import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
    ControllerRenderProps,
    InputState,
    useController,
    UseControllerOptions,
} from 'react-hook-form';
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

const isDecimalString = (value: string) => value.includes('.');

const cleanValueString = (value: string, locale: Locale) => {
    const { decimalSeparator, thousandsSeparator } = getLocaleSeparators(locale);

    let cleanedValue = value
        .replace(/\s/g, '')
        .replaceAll(thousandsSeparator, '')
        .replaceAll(decimalSeparator, '.');

    if (cleanedValue.startsWith('.')) {
        cleanedValue = `0${cleanedValue}`;
    }

    return cleanedValue;
};

const DECIMAL_SEPARATOR_CODES = [44, 46]; // [",", "."]

type TypedMethods = {
    field: Omit<ControllerRenderProps<Record<string, unknown>>, 'ref' | 'value'> & {
        value: string | undefined;
        ref?: React.RefObject<HTMLInputElement>;
    };
    meta: InputState;
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
    const [pressedKey, setPressedKey] = useState('');

    const {
        field: { value, onChange, ref: inputRef, ...controlProps },
        meta: { invalid },
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
            const cleanValue = cleanValueString(value, locale);

            // don't localize when entering a separator or a 0 in decimals (e.g. 0.0000 -> 0.00001),
            // otherwise the separator might get removed
            const lastSymbolCode = value.at(-1)?.charCodeAt(0);
            const zeroCharCode = 48;
            if (
                (lastSymbolCode && [...DECIMAL_SEPARATOR_CODES].includes(lastSymbolCode)) ||
                (isDecimalString(cleanValue) && zeroCharCode === lastSymbolCode)
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
            const formattedNumber = localizeNumber(cleanValue, locale);
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
            previousFormValueRef.current = cleanFormValue;
        }
    }, [formatDisplayValue, displayValue, value, locale]);

    const handleChange = useCallback(
        (inputValue: string) => {
            if (!inputRef.current) {
                return;
            }

            // read cursor position before formatting
            let { selectionStart: cursorPosition } = inputRef.current;
            if (cursorPosition === null) return;

            const { groupSeparatorCharCode } = getLocaleSeparatorCharCodes(locale);
            const previousDisplayValue = previousDisplayValueRef.current;
            // Ctrl+D on Mac
            const isDeleteKeyUsed =
                pressedKey === 'Delete' || pressedKey.toLocaleLowerCase() === 'd';
            // handle deleting a thousands separator with a DEL key,
            // otherwise the number instantly gets formatted back to having that separator
            if (inputValue.length < previousDisplayValue.length && isDeleteKeyUsed) {
                const deletedCharacterCode = previousDisplayValue.charCodeAt(cursorPosition);
                // is not needed for numbers without group separators (≤3 chars)
                if (deletedCharacterCode === groupSeparatorCharCode && inputValue.length > 3) {
                    inputValue =
                        previousDisplayValue.substring(0, cursorPosition) +
                        previousDisplayValue.substring(cursorPosition + 2);
                }
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

            // format and set display value
            const currentValueLength = inputRef.current?.value.length || 0;
            const formattedValue = formatDisplayValue(inputValue);
            if (formattedValue === undefined) return;
            const formattedValueLength = formattedValue.length;

            // pass cleaned value to the form
            previousFormValueRef.current = cleanInput;
            onChange(cleanInput);

            // get the latest error state
            const hasError = !!rules?.validate?.(cleanInput);
            // because the form is not updated yet after calling `onChange()`,
            // the value of `invalid` here is the one before this change has been handled
            const hasErrorStateChanged = hasError !== invalid;
            if (hasErrorStateChanged) {
                // delaying it becase the form needs some time to update the error state
                // TODO: get rid of `onChangeCallback()` entirely and use the `watch` method from react-hook form
                setTimeout(() => {
                    onChangeCallback?.(cleanInput);
                }, 0);
            } else {
                onChangeCallback?.(cleanInput);
            }

            // detect if separators have been added/removed
            // do not move the cursor in case of 123,456 => 1,123,456 (it moves 1 additional char if unhandled)
            const lengthDelta = formattedValueLength - currentValueLength;
            if (
                lengthDelta > 0 &&
                cursorPosition !== 1 &&
                formattedValue.charCodeAt(cursorPosition) !== groupSeparatorCharCode
            ) {
                cursorPosition += lengthDelta;
                // do not move the cursor if it was at the beginning already
            } else if (lengthDelta < 0 && cursorPosition !== 0 && !isDeleteKeyUsed) {
                cursorPosition += lengthDelta;
                // handle some undesirable cases when deleting with delete key
            } else if (
                formattedValue.charCodeAt(cursorPosition - 1) === groupSeparatorCharCode &&
                isDeleteKeyUsed
            ) {
                cursorPosition += 1;
            }

            // make sure the cursor stays in the right place after formatting
            inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
        },
        [
            formatDisplayValue,
            locale,
            onChange,
            onChangeCallback,
            inputRef,
            invalid,
            rules,
            pressedKey,
        ],
    );

    // copy the non-formatted value
    const handleCopy = useCallback(
        (e: React.ClipboardEvent<HTMLInputElement>) => {
            if (!inputRef.current) {
                return;
            }

            const { selectionStart, selectionEnd, value } = inputRef.current;
            if (selectionStart === null || selectionEnd === null) {
                return;
            }

            const copiedString = value.substring(selectionStart, selectionEnd);
            e.clipboardData.setData('text/plain', cleanValueString(copiedString, locale));

            e.preventDefault();
        },
        [locale, inputRef],
    );

    // cut the non-formatted value and manually clear the input
    const handleCut = useCallback(
        (e: React.ClipboardEvent<HTMLInputElement>) => {
            handleCopy(e);

            if (!inputRef.current) {
                return;
            }

            const { selectionStart, selectionEnd, value } = inputRef.current;
            if (selectionStart === null || selectionEnd === null) {
                return;
            }

            const resultString = value.substring(0, selectionStart) + value.substring(selectionEnd);
            // needed for cursor repositioning logic in handleChange() to function
            inputRef.current.value = resultString;
            inputRef.current.selectionStart = selectionStart;
            handleChange(resultString);
        },
        [handleCopy, handleChange, inputRef],
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
    const handleSelect = useCallback(() => {
        if (!inputRef.current) {
            return;
        }

        const { selectionStart, selectionEnd, value } = inputRef.current;
        if (selectionStart === selectionEnd) {
            handleCursorShift(-1, -1);
        }

        if (selectionStart === null || selectionEnd === null) {
            return;
        }
        const selectedPart = value.substring(selectionStart, selectionEnd);
        const { groupSeparatorCharCode } = getLocaleSeparatorCharCodes(locale);
        // do not allow selecting group separators to avoid unwanted behavior
        if (selectedPart.length === 1 && selectedPart.charCodeAt(0) === groupSeparatorCharCode) {
            inputRef.current.selectionEnd = selectionStart;
        }
    }, [handleCursorShift, inputRef, locale]);

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
            setPressedKey(pressedKey);

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
            onSelect={handleSelect}
            onKeyDown={handleKeyDown}
            onBeforeInput={handleOnBeforeInput}
            onChange={e => handleChange(e.target.value)}
            onCopy={handleCopy}
            onCut={handleCut}
        />
    );
};
