import { useEffect, useRef } from 'react';
import { UseFormMethods } from 'react-hook-form';
import { FormState, FeeInfo } from '@wallet-types/sendForm';

type Props = UseFormMethods<FormState> & {
    defaultValue: FormState['selectedFee'];
    feeInfo?: FeeInfo;
    onChange?: (prev: FormState['selectedFee'], current: FormState['selectedFee']) => void;
    composeRequest: () => void;
};

// shareable sub-hook used in useRbfForm and useSendForm (TODO)

export const useFees = ({
    defaultValue,
    feeInfo,
    onChange,
    composeRequest,
    watch,
    getValues,
    setValue,
    errors,
    clearErrors,
}: Props) => {
    // local references
    const selectedFeeRef = useRef(defaultValue);
    const feePerUnitRef = useRef('');
    const feeLimitRef = useRef('');

    // watch selectedFee change and update local references
    const selectedFee = watch('selectedFee');
    useEffect(() => {
        if (selectedFeeRef.current === selectedFee) return;
        selectedFeeRef.current = selectedFee;
        const { feePerUnit, feeLimit } = getValues();
        feePerUnitRef.current = feePerUnit;
        feeLimitRef.current = feeLimit;
    }, [selectedFee, getValues]);

    // watch custom fee input change
    const feePerUnit = watch('feePerUnit');
    useEffect(() => {
        if (selectedFeeRef.current === 'custom' && feePerUnitRef.current !== feePerUnit) {
            feePerUnitRef.current = feePerUnit;
            composeRequest();
        }
    }, [feePerUnit, composeRequest]);

    // called from UI on click
    const changeFeeLevel = (level: FormState['selectedFee']) => {
        if (selectedFeeRef.current === level || !feeInfo) return;

        let feePerUnit;
        let feeLimit;
        if (level === 'custom' && !feePerUnitRef.current) {
            // switching to custom FeeLevel for the first time
            // set custom values from a previously selected FeeLevel
            const currentLevel = feeInfo.levels.find(
                l => l.label === (selectedFeeRef.current || 'normal'),
            )!;
            feePerUnit = currentLevel.feePerUnit;
            feeLimit = currentLevel.feeLimit || '';
        } else if (selectedFeeRef.current === 'custom' && (errors.feePerUnit || errors.feeLimit)) {
            // switching from custom FeeLevel which has an error
            // error should be cleared and levels should be precomposed again
            feePerUnit = '';
            feeLimit = '';
            clearErrors(['feePerUnit', 'feeLimit']);
            composeRequest();
        }

        setValue('selectedFee', level);
        // update local references
        if (typeof feePerUnit === 'string' && typeof feeLimit === 'string') {
            feePerUnitRef.current = feePerUnit;
            setValue('feePerUnit', feePerUnit);
            feeLimitRef.current = feeLimit;
            setValue('feeLimit', feeLimit);
        }

        // on change callback
        if (onChange) onChange(selectedFeeRef.current, level);
        selectedFeeRef.current = selectedFee;
    };

    return {
        changeFeeLevel,
    };
};
