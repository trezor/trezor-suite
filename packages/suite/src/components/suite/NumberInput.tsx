import {
    useCallback,
    useLayoutEffect,
    useRef,
    useState,
    KeyboardEvent,
    ClipboardEvent,
    FormEvent,
} from 'react';

import { Control, FieldValues, useController, UseControllerProps } from 'react-hook-form';
import BigNumber from 'bignumber.js';

import { Input, InputProps } from '@trezor/components';
import { localizeNumber } from '@suite-common/wallet-utils';
import { Locale } from 'src/config/suite/languages';
import { useSelector } from 'src/hooks/suite';
import { getLocaleSeparators } from '@trezor/utils';

const isValidDecimalString = (value: string) => /^([^.]*)\.[^.]+$/.test(value);
const hasLeadingZeroes = (value: string) => /^0+(\d+\.\d*|\d+)$/.test(value);

const removeLeadingZeroes = (value: string) => value.replace(/^0+(?!\.|$)/, '');

const cleanValueString = (value: string, locale: Locale) => {
    if (value === undefined) {
        return '';
    }

    // in case somehow the value is a number, convert it to string
    if (typeof value !== 'string') {
        value = String(value);
    }

    const { decimalSeparator, thousandsSeparator } = getLocaleSeparators(locale);

    // clean the entered number string if it's not convertable to Number or if it has a non-conventional format
    if (
        !Number.isNaN(Number(value)) &&
        thousandsSeparator !== '.' &&
        !hasLeadingZeroes(value) &&
        value.at(0) !== '.' &&
        value.at(-1) !== '.'
    ) {
        return value;
    }

    let cleanedValue = value
        .replace(/\s/g, '')
        .replaceAll(thousandsSeparator, '')
        .replaceAll(decimalSeparator, '.');

    // allow inputs like '.031' or ',1'
    if (!isValidDecimalString(cleanedValue.substring(1)) && cleanedValue.startsWith('.')) {
        cleanedValue = `0${cleanedValue}`;
    }

    // remove extra decimal separators when a number is already a decimal
    if (!isValidDecimalString(cleanedValue) && cleanedValue.endsWith('.')) {
        cleanedValue = cleanedValue.slice(0, cleanedValue.length - 1);
    }

    if (cleanedValue) {
        // do not convert to the exponential format to avoid unexpected results
        BigNumber.config({ EXPONENTIAL_AT: 20 });

        cleanedValue = new BigNumber(cleanedValue).toFixed();
    }

    return cleanedValue;
};

const DECIMAL_SEPARATORS = [',', '.'];

export interface NumberInputProps<TFieldValues extends FieldValues>
    extends Omit<InputProps, 'defaultValue' | 'name' | 'onChange'>,
        Omit<UseControllerProps<TFieldValues>, 'rules'> {
    decimalScale?: number;
    onChange?: (value: string) => void;
    rules?: UseControllerProps['rules'];
}

export const NumberInput = <TFieldValues extends FieldValues>({
    name,
    rules,
    control,
    onChange: onChangeCallback,
    defaultValue,
    ...props
}: NumberInputProps<TFieldValues>) => {
    const {
        field: { value = '', onChange, ref, ...controlProps },
        fieldState: { invalid },
    } = useController({
        name,
        control: control as Control<FieldValues>,
        rules,
        defaultValue,
    });

    const locale = useSelector(state => state.suite.settings.language);
    const [pressedKey, setPressedKey] = useState('');
    const [displayValue, setDisplayValue] = useState(localizeNumber(value, locale));
    const [changeHistory, setChangeHistory] = useState<string[]>([value]);
    const [redoHistory, setRedoHistory] = useState<string[]>([]);

    const inputRef = useRef<HTMLInputElement | null>(null);
    const previousFormValueRef = useRef<string | undefined>(value);
    const previousDisplayValueRef = useRef<string | undefined>(displayValue);

    // formats and sets the value visible in the input (not the form)
    const formatDisplayValue = useCallback(
        (rawValue: string, cleanValue: string) => {
            const handleSetDisplayValue = (newDisplayValue: string) => {
                setDisplayValue(newDisplayValue);

                if (!inputRef?.current) {
                    return;
                }

                previousDisplayValueRef.current = newDisplayValue;
                inputRef.current.value = newDisplayValue; // for setSelectionRange() working as intended

                setChangeHistory(current => [...current, newDisplayValue]);

                return newDisplayValue;
            };

            // in case somehow the value is a number, convert it to string
            if (typeof rawValue !== 'string') {
                rawValue = String(rawValue);
            }

            // don't localize when entering a separator or a 0 in decimals (e.g. 0.0000 -> 0.00001),
            // otherwise the separator might get removed
            const { decimalSeparator } = getLocaleSeparators(locale);
            const lastSymbol = rawValue.at(-1);

            if (
                lastSymbol &&
                (DECIMAL_SEPARATORS.includes(lastSymbol) ||
                    (lastSymbol === '0' && rawValue.includes(decimalSeparator)))
            ) {
                if (lastSymbol !== '0') {
                    // disallow entering more than one separator
                    const secondToLastSymbol = rawValue.at(-2);
                    if (secondToLastSymbol && DECIMAL_SEPARATORS.includes(secondToLastSymbol)) {
                        return;
                    }

                    // format a decimal separator to a locale-specific one to allow entering either one

                    // ignore additional decimal separators when a number is already a decimal
                    if (rawValue.slice(0, -1).includes(decimalSeparator)) {
                        rawValue = rawValue.slice(0, -1);
                    } else if (lastSymbol !== decimalSeparator) {
                        rawValue = rawValue.slice(0, -1) + decimalSeparator;
                        // }
                    }
                }

                // the number is incomplete and not ready do be localized (e.g. 1,234. or 1,0000)
                return handleSetDisplayValue(removeLeadingZeroes(rawValue));
            }

            // clean so that it's compatible with Number() and localize
            const formattedNumber = localizeNumber(cleanValue, locale);

            return handleSetDisplayValue(formattedNumber);
        },
        [inputRef, locale],
    );

    // react to form data changes
    useLayoutEffect(() => {
        const cleanPrevFormValue = cleanValueString(previousFormValueRef.current ?? '', locale);
        const cleanFormValue = cleanValueString(value ?? '', locale);
        const cleanPrevDisplayValue = cleanValueString(
            previousDisplayValueRef.current ?? '',
            locale,
        );
        const cleanDisplayValue = cleanValueString(displayValue, locale);

        if (cleanPrevFormValue !== cleanFormValue && cleanPrevDisplayValue === cleanDisplayValue) {
            // since the value comes from and is valid, repeated formatting might case errors for some locales
            formatDisplayValue(value ?? '', value ?? '');
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

            const { thousandsSeparator } = getLocaleSeparators(locale);
            const previousDisplayValue = previousDisplayValueRef.current ?? '';
            // Ctrl+D on Mac
            const isDeleteKeyUsed =
                pressedKey === 'Delete' || pressedKey.toLocaleLowerCase() === 'd';
            // handle deleting a thousands separator with a DEL key,
            // otherwise the number instantly gets formatted back to having that separator
            if (inputValue.length < previousDisplayValue.length && isDeleteKeyUsed) {
                const deletedCharacter = previousDisplayValue.at(cursorPosition);
                // is not needed for numbers without group separators (≤3 chars)
                if (deletedCharacter === thousandsSeparator && inputValue.length > 3) {
                    inputValue =
                        previousDisplayValue.substring(0, cursorPosition) +
                        previousDisplayValue.substring(cursorPosition + 2);
                }
            }

            const cleanInput = cleanValueString(inputValue, locale);

            // allow inputs like '.031' or ',1' and disallow anything non-numerical
            if (!(cleanInput === '.') && Number.isNaN(Number(cleanInput))) {
                // avoid cursor moving when typing in additional decimal separators
                formatDisplayValue(
                    previousDisplayValue,
                    cleanValueString(previousDisplayValue, locale),
                );
                inputRef.current.setSelectionRange(cursorPosition - 1, cursorPosition - 1);

                return;
            }

            // format and set display value
            const currentValueLength = inputRef.current?.value.length || 0;
            const formattedValue = formatDisplayValue(inputValue, cleanInput);
            if (formattedValue === undefined) return;
            const formattedValueLength = formattedValue.length;

            if (previousFormValueRef.current !== cleanInput) {
                // pass cleaned value to the form
                previousFormValueRef.current = cleanInput;
                onChange(cleanInput);

                // get the latest error state
                const hasError =
                    (typeof rules?.validate === 'function' &&
                        !!rules?.validate?.(cleanInput, {})) ||
                    (typeof rules?.validate === 'object' &&
                        Object.values(rules.validate).some(validateFunction =>
                            validateFunction(cleanInput, {}),
                        ));
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
            }

            // detect if separators have been added/removed
            // do not move the cursor in case of 123,456 => 1,123,456 (it moves 1 additional char if unhandled)
            const lengthDelta = formattedValueLength - currentValueLength;
            if (
                lengthDelta > 0 &&
                cursorPosition !== 1 &&
                formattedValue.at(cursorPosition) !== thousandsSeparator
            ) {
                cursorPosition += lengthDelta;
                // do not move the cursor if it was at the beginning already
            } else if (lengthDelta < 0 && cursorPosition !== 0 && !isDeleteKeyUsed) {
                cursorPosition += lengthDelta;
                // handle some undesirable cases when deleting with delete key
            } else if (
                formattedValue.at(cursorPosition - 1) === thousandsSeparator &&
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
        (e: ClipboardEvent<HTMLInputElement>) => {
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
        (e: ClipboardEvent<HTMLInputElement>) => {
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
    const handleOnBeforeInput = useCallback((e: FormEvent<HTMLInputElement> & { data: string }) => {
        if (/[\d.,]/g.test(e.data)) {
            // reset the redo history when a new digit is entered
            setRedoHistory([]);

            return;
        }

        e.preventDefault();
    }, []);

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

            const { thousandsSeparator } = getLocaleSeparators(locale);
            const characterBeforeCursor = value[cursorPosition + cursorCharacterOffset];

            if (characterBeforeCursor?.at(0) === thousandsSeparator) {
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
        const { thousandsSeparator } = getLocaleSeparators(locale);
        // do not allow selecting group separators to avoid unwanted behavior
        if (selectedPart.length === 1 && selectedPart.at(0) === thousandsSeparator) {
            inputRef.current.selectionEnd = selectionStart;
        }
    }, [handleCursorShift, inputRef, locale]);

    // jump over group separators when navigatind the input
    const handleKeyNav = useCallback(
        (e: KeyboardEvent<HTMLInputElement>) => {
            const pressedKey = e.key;

            if (pressedKey === 'ArrowRight') handleCursorShift(0, 1);
            if (pressedKey === 'ArrowLeft') handleCursorShift(-2, -1);
        },
        [handleCursorShift],
    );

    const handleUndo = useCallback(() => {
        if (changeHistory.length < 2) {
            return;
        }

        const previousValue = changeHistory.at(-2) || '';
        handleChange(previousValue);

        setRedoHistory(current => [...current, changeHistory.at(-1) || '']);
        setChangeHistory(current => [...current].splice(0, current.length - 2));
    }, [changeHistory, handleChange]);

    const handleRedo = useCallback(() => {
        if (!redoHistory.length) {
            return;
        }

        const previousValue = redoHistory.at(-1) || '';
        handleChange(previousValue);

        setRedoHistory(current => [...current].splice(0, current.length - 1));
    }, [redoHistory, handleChange]);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent<HTMLInputElement>) => {
            const pressedKey = e.key;
            setPressedKey(pressedKey);

            if (['ArrowLeft', 'ArrowRight'].includes(pressedKey)) {
                handleKeyNav(e);

                return;
            }

            if (!e.shiftKey && (e.ctrlKey || e.metaKey) && pressedKey.toLocaleLowerCase() === 'z') {
                e.preventDefault();
                handleUndo();

                return;
            }

            if (e.shiftKey && (e.ctrlKey || e.metaKey) && pressedKey.toLocaleLowerCase() === 'z') {
                e.preventDefault();
                handleRedo();

                return;
            }

            if (pressedKey === 'Backspace') {
                setRedoHistory([]);
            }
        },
        [handleKeyNav, handleUndo, handleRedo],
    );

    return (
        <Input
            {...props}
            {...controlProps}
            innerRef={e => {
                ref(e);
                inputRef.current = e;
            }}
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
