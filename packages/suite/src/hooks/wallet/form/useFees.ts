import { useEffect, useRef } from 'react';
import { FieldPath, UseFormReturn } from 'react-hook-form';
import { FeeLevel } from '@trezor/connect';
import { useDispatch } from 'src/hooks/suite';
import {
    FeeInfo,
    FormState,
    PrecomposedLevels,
    PrecomposedLevelsCardano,
} from '@suite-common/wallet-types';
import { SendContextValues } from '../../../types/wallet/sendForm';

interface Props<TFieldValues extends FormState> extends UseFormReturn<TFieldValues> {
    defaultValue?: FeeLevel['label'];
    feeInfo?: FeeInfo;
    saveLastUsedFee?: boolean;
    onChange?: (prev?: FeeLevel['label'], current?: FeeLevel['label']) => void;
    composeRequest: SendContextValues['composeTransaction'];
    composedLevels?: PrecomposedLevels | PrecomposedLevelsCardano;
}

// shareable sub-hook used in useRbfForm and useSendForm (TODO)

export const useFees = <TFieldValues extends FormState>({
    defaultValue,
    feeInfo,
    saveLastUsedFee,
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
    const estimatedFeeLimitRef = useRef<string | undefined>('');
    const saveLastUsedFeeRef = useRef(saveLastUsedFee);

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
        const { feePerUnit, feeLimit } = getValues();
        feePerUnitRef.current = feePerUnit;
        feeLimitRef.current = feeLimit;
    }, [selectedFee, getValues]);

    // watch custom feePerUnit/feeLimit inputs change
    const feePerUnit = watch('feePerUnit');
    const feeLimit = watch('feeLimit');
    const baseFee = watch('baseFee');
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

        // compose
        if (updateField && composeRequest) {
            composeRequest(updateField);
        }
    }, [dispatch, feePerUnit, feeLimit, errors.feePerUnit, errors.feeLimit, composeRequest]);

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
        if (level === 'custom') {
            // switching to custom FeeLevel for the first time
            const currentLevel = feeInfo.levels.find(
                l => l.label === (selectedFeeRef.current || 'normal'),
            )!;
            // set custom values from a previously selected composed transaction
            // or from previously selected FeeLevel
            const transactionInfo = composedLevels && composedLevels[currentLevel.label];
            feePerUnit =
                !baseFee && transactionInfo && transactionInfo.type !== 'error'
                    ? transactionInfo.feePerByte
                    : currentLevel.feePerUnit;
            feeLimit = getValues('estimatedFeeLimit') || currentLevel.feeLimit || '';
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
        selectedFee,
    };
};
