import { useState } from 'react';
import type { TextInputSelectionChangeEvent } from 'react-native';

import { getLocaleSeparators } from '@trezor/utils';

import {
    formatRawAmount,
    getDisplayMaxLength,
    getEditedRawAmount,
} from '../localizedAmountInputUtils';

type TextSelection = {
    start: number;
    end: number;
};

export type UseLocalizedAmountInputParams = {
    rawAmount: string | undefined;
    locale: string;
    maxDecimals?: number;
    maxLength?: number;
    onRawAmountChange: (rawAmount: string | undefined) => void;
    onSelectionChange?: (event: TextInputSelectionChangeEvent) => void;
};

export const useLocalizedAmountInput = ({
    rawAmount = '',
    locale,
    maxDecimals,
    maxLength,
    onRawAmountChange,
    onSelectionChange,
}: UseLocalizedAmountInputParams) => {
    const [textSelection, setTextSelection] = useState<TextSelection>();

    const separators = getLocaleSeparators(locale);
    const displayedAmount = formatRawAmount(rawAmount, locale);

    const cursorAtEnd = { start: displayedAmount.length, end: displayedAmount.length };
    const isTextSelected =
        textSelection !== undefined &&
        textSelection.start !== textSelection.end &&
        textSelection.end <= displayedAmount.length;
    const isWholeTextSelected =
        isTextSelected && textSelection.start === 0 && textSelection.end === cursorAtEnd.end;

    const handleChangeText = (nextDisplayedAmount: string) => {
        setTextSelection(undefined);

        const editedRawAmount = getEditedRawAmount({
            previousDisplayedAmount: isWholeTextSelected ? '' : displayedAmount,
            nextDisplayedAmount,
            separators,
            limits: { maxDecimals, maxLength },
        });

        if (editedRawAmount === null || editedRawAmount === rawAmount) {
            return;
        }

        onRawAmountChange(editedRawAmount === '' ? undefined : editedRawAmount);
    };

    const handleSelectionChange = (event: TextInputSelectionChangeEvent) => {
        setTextSelection(event.nativeEvent.selection);
        onSelectionChange?.(event);
    };

    return {
        value: displayedAmount,
        selection: isTextSelected ? textSelection : cursorAtEnd,
        maxLength: isTextSelected
            ? undefined
            : getDisplayMaxLength({
                  displayedAmount,
                  decimalSeparator: separators.decimalSeparator,
                  maxDecimals,
              }),
        onChangeText: handleChangeText,
        onSelectionChange: handleSelectionChange,
    };
};
