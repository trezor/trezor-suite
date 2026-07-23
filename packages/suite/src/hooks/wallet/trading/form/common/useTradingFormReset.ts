import { useEffect, useRef } from 'react';
import { type FieldValues, type UseFormReset } from 'react-hook-form';

interface UseTradingFormResetParams<TFieldValues extends FieldValues> {
    isInfoReady: boolean;
    reset: UseFormReset<TFieldValues>;
    defaultValues: TFieldValues;
    getPreservedValues?: () => Partial<TFieldValues>;
}

export const useTradingFormReset = <TFieldValues extends FieldValues>({
    isInfoReady,
    reset,
    defaultValues,
    getPreservedValues,
}: UseTradingFormResetParams<TFieldValues>) => {
    const shouldReset = useRef(!isInfoReady);

    useEffect(() => {
        if (isInfoReady && shouldReset.current) {
            shouldReset.current = false;
            reset({
                ...defaultValues,
                ...getPreservedValues?.(),
            });
        }
    }, [isInfoReady, reset, defaultValues, getPreservedValues]);
};
