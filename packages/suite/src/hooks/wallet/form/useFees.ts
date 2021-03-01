import { useEffect, useRef } from 'react';
import { UseFormMethods } from 'react-hook-form';
import { FeeLevel } from 'trezor-connect';
import * as walletSettingsActions from '@settings-actions/walletSettingsActions';
import { useActions } from '@suite-hooks';
import { FeeInfo, PrecomposedLevels } from '@wallet-types/sendForm';

type Props = UseFormMethods<{
    selectedFee?: FeeLevel['label'];
    feePerUnit?: string;
    feeLimit?: string;
    estimatedFeeLimit?: string;
}> & {
    defaultValue?: FeeLevel['label'];
    feeInfo?: FeeInfo;
    saveLastUsedFee?: boolean;
    onChange?: (prev?: FeeLevel['label'], current?: FeeLevel['label']) => void;
    composeRequest?: (field?: string) => void;
    composedLevels?: PrecomposedLevels;
};

// shareable sub-hook used in useRbfForm and useSendForm (TODO)

export const useFees = ({
    defaultValue,
    feeInfo,
    saveLastUsedFee,
    onChange,
    composeRequest,
    composedLevels,
    watch,
    register,
    getValues,
    setValue,
    errors,
    clearErrors,
}: Props) => {
    // local references
    const selectedFeeRef = useRef(defaultValue);
    const feePerUnitRef = useRef<string | undefined>('');
    const feeLimitRef = useRef<string | undefined>('');
    const estimatedFeeLimitRef = useRef<string | undefined>('');
    const saveLastUsedFeeRef = useRef(saveLastUsedFee);

    const { setLastUsedFeeLevel } = useActions({
        setLastUsedFeeLevel: walletSettingsActions.setLastUsedFeeLevel,
    });

    // register custom form fields (without HTMLElement)
    useEffect(() => {
        register({ name: 'selectedFee', type: 'custom' }); // NOTE: custom is not a fee level, its a type of `react-hook-form` field
        register({ name: 'estimatedFeeLimit', type: 'custom' });
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
    useEffect(() => {
        if (selectedFeeRef.current !== 'custom') return;

        let updateField: string | undefined;
        if (feePerUnitRef.current !== feePerUnit) {
            feePerUnitRef.current = feePerUnit;
            updateField = 'feePerUnit';
        }

        if (feeLimitRef.current !== feeLimit) {
            feeLimitRef.current = feeLimit;
            updateField = 'feeLimit';
        }

        // compose
        if (updateField) {
            if (composeRequest) composeRequest(updateField);
            // save last used fee
            if (
                saveLastUsedFeeRef.current &&
                feePerUnit &&
                !errors.feePerUnit &&
                !errors.feeLimit
            ) {
                setLastUsedFeeLevel({ label: 'custom', feePerUnit, feeLimit, blocks: -1 });
            }
        }
    }, [
        feePerUnit,
        feeLimit,
        errors.feePerUnit,
        errors.feeLimit,
        composeRequest,
        setLastUsedFeeLevel,
    ]);

    // watch estimatedFee change
    const estimatedFeeLimit = watch('estimatedFeeLimit');
    useEffect(() => {
        if (selectedFeeRef.current !== 'custom') return;
        if (estimatedFeeLimitRef.current !== estimatedFeeLimit) {
            estimatedFeeLimitRef.current = estimatedFeeLimit;
            if (estimatedFeeLimit) {
                // re validate feeLimit
                // setValue('feeLimit', feeLimitRef.current, { shouldValidate: true });
                // switch to recommended fee limit
                feeLimitRef.current = estimatedFeeLimit;
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
            const transactionInfo = composedLevels && composedLevels[selectedFeeRef.current!];
            feePerUnit =
                transactionInfo && transactionInfo.type !== 'error'
                    ? transactionInfo.feePerByte
                    : currentLevel.feePerUnit;
            feeLimit = getValues('estimatedFeeLimit') || currentLevel.feeLimit || '';
        } else if (selectedFeeRef.current === 'custom' && (errors.feePerUnit || errors.feeLimit)) {
            // switching from custom FeeLevel which has an error
            // error should be cleared and levels should be precomposed again
            feePerUnit = '';
            feeLimit = '';
            clearErrors(['feePerUnit', 'feeLimit']);
            if (composeRequest) composeRequest();
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

        // save last used fee
        if (level !== 'custom' && saveLastUsedFeeRef.current) {
            const nextLevel = feeInfo.levels.find(l => l.label === (level || 'normal'))!;
            setLastUsedFeeLevel(nextLevel);
        }

        selectedFeeRef.current = selectedFee;
    };

    return {
        changeFeeLevel,
    };
};
