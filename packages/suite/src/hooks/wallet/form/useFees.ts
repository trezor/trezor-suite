import { useEffect, useRef } from 'react';
import { FieldPath, UseFormReturn } from 'react-hook-form';

import {
    FeeInfo,
    FormState,
    PrecomposedLevels,
    PrecomposedLevelsCardano,
} from '@suite-common/wallet-types';
import { isEip1559 } from '@suite-common/wallet-utils';
import { FeeLevel } from '@trezor/connect';

import { useDispatch } from 'src/hooks/suite';

import { SendContextValues } from '../../../types/wallet/sendForm';

interface Props<TFieldValues extends FormState> extends UseFormReturn<TFieldValues> {
    defaultValue?: FeeLevel['label'];
    feeInfo?: FeeInfo;
    onChange?: (prev?: FeeLevel['label'], current?: FeeLevel['label']) => void;
    composeRequest: SendContextValues['composeTransaction'];
    composedLevels?: PrecomposedLevels | PrecomposedLevelsCardano;
}

// shareable sub-hook used in useRbfForm and useSendForm (TODO)

export const useFees = <TFieldValues extends FormState>({
    defaultValue,
    feeInfo,
    onChange,
    composeRequest,
    composedLevels,
    formState: { errors },
    ...props
}: Props<TFieldValues>) => {
    const dispatch = useDispatch();

    // local references
    const selectedFeeRef = useRef(defaultValue);
    const feePerUnitRef = useRef<string | undefined>('');
    const feeLimitRef = useRef<string | undefined>('');
    const maxPriorityFeePerGasRef = useRef<string | undefined>('');
    const maxFeePerGasRef = useRef<string | undefined>('');
    const estimatedFeeLimitRef = useRef<string | undefined>('');

    // Type assertion allowing to make the component reusable, see https://stackoverflow.com/a/73624072.
    const { clearErrors, getValues, register, setValue, watch } =
        props as unknown as UseFormReturn<FormState>;

    // register custom form fields (without HTMLElement)
    useEffect(() => {
        register('selectedFee', { shouldUnregister: true });
        register('estimatedFeeLimit', { shouldUnregister: true });
    }, [register]);

    // watch selectedFee change and update local references
    const selectedFee = watch('selectedFee');
    useEffect(() => {
        if (selectedFeeRef.current === selectedFee) return;
        selectedFeeRef.current = selectedFee;
        const { feePerUnit, feeLimit, maxPriorityFeePerGas, maxFeePerGas } = getValues();
        feePerUnitRef.current = feePerUnit;
        feeLimitRef.current = feeLimit;
        maxPriorityFeePerGasRef.current = maxPriorityFeePerGas;
        maxFeePerGasRef.current = maxFeePerGas;
    }, [selectedFee, getValues]);

    // watch custom feePerUnit/feeLimit inputs change
    const feePerUnit = watch('feePerUnit');
    const feeLimit = watch('feeLimit');
    const baseFee = watch('baseFee');
    const maxPriorityFeePerGas = watch('maxPriorityFeePerGas');
    const maxFeePerGas = watch('maxFeePerGas');

    useEffect(() => {
        if (selectedFeeRef.current !== 'custom') return;

        let updateField: FieldPath<FormState> | undefined;
        if (feePerUnitRef.current !== feePerUnit) {
            feePerUnitRef.current = feePerUnit;
            updateField = 'feePerUnit';
        }

        if (feeLimitRef.current !== feeLimit) {
            feeLimitRef.current = feeLimit;
            updateField = 'feeLimit';
        }

        if (maxPriorityFeePerGasRef.current !== maxPriorityFeePerGas) {
            maxPriorityFeePerGasRef.current = maxPriorityFeePerGas;
            updateField = 'maxPriorityFeePerGas';
        }

        if (maxFeePerGasRef.current !== maxFeePerGas) {
            maxFeePerGasRef.current = maxFeePerGas;
            updateField = 'maxFeePerGas';
        }

        //compose
        if (updateField && composeRequest) {
            composeRequest(updateField);
        }
    }, [
        dispatch,
        feePerUnit,
        feeLimit,
        maxPriorityFeePerGas,
        maxFeePerGas,
        errors.feePerUnit,
        errors.feeLimit,
        composeRequest,
        setValue,
    ]);

    // watch estimatedFee change
    const estimatedFeeLimit = watch('estimatedFeeLimit');
    useEffect(() => {
        if (estimatedFeeLimitRef.current !== estimatedFeeLimit) {
            estimatedFeeLimitRef.current = estimatedFeeLimit;
            if (selectedFeeRef.current !== 'custom') return;
            if (estimatedFeeLimit) {
                // NOTE: do not update it here, so it can be properly processed by watch
                // feeLimitRef.current = estimatedFeeLimit;
                setValue('feeLimit', estimatedFeeLimit, { shouldValidate: true });
            }
        }
    }, [estimatedFeeLimit, setValue]);

    // called from UI on click
    const changeFeeLevel = (level: FeeLevel['label']) => {
        if (selectedFeeRef.current === level || !feeInfo) return;

        let feePerUnit;
        let feeLimit;
        let maxPriorityFeePerGas;
        let maxFeePerGas;
        if (level === 'custom') {
            // switching to custom FeeLevel for the first time
            const currentLevel = feeInfo.levels.find(
                l => l.label === (selectedFeeRef.current || 'normal'),
            )!;
            // set custom values from a previously selected composed transaction
            // or from previously selected FeeLevel
            const transactionInfo = composedLevels && composedLevels[currentLevel.label];

            const hasNoError = !baseFee && transactionInfo && transactionInfo.type !== 'error';

            feePerUnit = hasNoError ? transactionInfo.feePerByte : currentLevel.feePerUnit;
            feeLimit = getValues('estimatedFeeLimit') || currentLevel.feeLimit || '';

            maxPriorityFeePerGas =
                hasNoError && 'maxPriorityFeePerGas' in transactionInfo
                    ? transactionInfo.maxPriorityFeePerGas
                    : currentLevel.maxPriorityFeePerGas;
            maxFeePerGas =
                hasNoError && isEip1559(transactionInfo)
                    ? transactionInfo.maxFeePerGas
                    : currentLevel.maxFeePerGas;
        } else if (selectedFeeRef.current === 'custom' && (errors.feePerUnit || errors.feeLimit)) {
            // switching from custom FeeLevel which has an error
            // error should be cleared and levels should be precomposed again
            feePerUnit = '';
            feeLimit = '';
            clearErrors(['feePerUnit', 'feeLimit', 'maxPriorityFeePerGas', 'maxFeePerGas']);
            composeRequest();
        }

        setValue('selectedFee', level);
        // update local references
        if (typeof feePerUnit === 'string') {
            feePerUnitRef.current = feePerUnit;
            setValue('feePerUnit', feePerUnit);
        }

        if (typeof feeLimit === 'string') {
            feeLimitRef.current = feeLimit;
            setValue('feeLimit', feeLimit);
        }

        if (typeof maxPriorityFeePerGas === 'string') {
            maxPriorityFeePerGasRef.current = maxPriorityFeePerGas;
            setValue('maxPriorityFeePerGas', maxPriorityFeePerGas);
        }

        if (typeof maxFeePerGas === 'string') {
            maxFeePerGasRef.current = maxFeePerGas;
            setValue('maxFeePerGas', maxFeePerGas);
        }

        // on change callback
        if (onChange) onChange(selectedFeeRef.current, level);

        selectedFeeRef.current = selectedFee;
    };

    return {
        changeFeeLevel,
        selectedFee,
    };
};
