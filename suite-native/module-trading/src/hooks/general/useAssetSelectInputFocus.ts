import { type RefObject, useCallback, useState } from 'react';
import { type TextInput } from 'react-native';

type AmountInputRef = RefObject<TextInput | null>;

/**
 * Focuses the amount input that opened the asset picker once an asset is selected.
 */
export const useAssetSelectInputFocus = () => {
    const [inputRefToFocus, setInputRefToFocus] = useState<AmountInputRef | null>(null);

    const requestInputFocus = useCallback((inputRef: AmountInputRef) => {
        setInputRefToFocus(inputRef);
    }, []);

    const focusRequestedInput = useCallback(() => {
        if (!inputRefToFocus) {
            return;
        }

        setInputRefToFocus(null);
        setTimeout(() => {
            inputRefToFocus.current?.focus();
        }, 0);
    }, [inputRefToFocus]);

    return { requestInputFocus, focusRequestedInput };
};
