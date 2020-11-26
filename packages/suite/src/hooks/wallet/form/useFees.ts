import { useEffect, useRef, useCallback } from 'react';
import { UseFormMethods } from 'react-hook-form';
import { FormState, FeeInfo } from '@wallet-types/sendForm';

type Props = UseFormMethods<FormState> & {
    defaultValue: FormState['selectedFee'];
    feeInfo: FeeInfo;
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
    const selectedFee = watch('selectedFee');
    const selectedFeeRef = useRef(defaultValue);
    const feePerUnitRef = useRef('');
    const feeLimitRef = useRef('');
    // watch selectedFee change and update composedLevels or save draft
    useEffect(() => {
        if (selectedFeeRef.current === selectedFee || !feeInfo) return;

        const currentLevel = feeInfo.levels.find(
            l => l.label === selectedFeeRef.current || 'normal',
        )!;
        let feePerUnit = '';
        let feeLimit = '';
        if (selectedFee === 'custom') {
            feePerUnit = currentLevel.feePerUnit;
            feeLimit = currentLevel.feeLimit || '';
        } else {
            // switching from custom FeeLevel which has an error
            // error should be cleared and levels should be precomposed again
            const shouldCompose = errors.feePerUnit || errors.feeLimit;
            if (shouldCompose) {
                clearErrors(['feePerUnit', 'feeLimit']);
                composeRequest();
            }
        }

        feePerUnitRef.current = feePerUnit;
        setValue('feePerUnit', feePerUnit);
        feeLimitRef.current = feeLimit;
        setValue('feeLimit', feeLimit);

        if (onChange) onChange(selectedFeeRef.current, selectedFee);
        selectedFeeRef.current = selectedFee;

        // TODO: optional setLastUsedFeeLevel(newLevel);
    }, [
        selectedFee,
        feeInfo,
        setValue,
        errors.feePerUnit,
        errors.feeLimit,
        clearErrors,
        onChange,
        composeRequest,
    ]);

    // watch custom fee input change
    const feePerUnit = watch('feePerUnit');
    useEffect(() => {
        if (selectedFeeRef.current === 'custom' && feePerUnitRef.current !== feePerUnit) {
            feePerUnitRef.current = feePerUnit;
            composeRequest();
        }
    }, [feePerUnit, composeRequest]);

    const switchToNearestFee = useCallback(
        (composedLevels: any) => {
            const { selectedFee, setMaxOutputId } = getValues();
            let composed = composedLevels[selectedFee || 'normal'];

            // selectedFee was not set yet (no interaction with Fees) and default (normal) fee tx is not valid
            // OR setMax option was used
            // try to switch to nearest possible composed transaction
            const shouldSwitch =
                !selectedFee || (typeof setMaxOutputId === 'number' && selectedFee !== 'custom');
            if (shouldSwitch && composed.type === 'error') {
                // find nearest possible tx
                const nearest = Object.keys(composedLevels).find(
                    key => composedLevels[key].type !== 'error',
                );
                // switch to it
                if (nearest) {
                    composed = composedLevels[nearest];
                    setValue('selectedFee', nearest);
                    if (nearest === 'custom') {
                        // @ts-ignore: type = error already filtered above
                        const { feePerByte, feeLimit } = composed;
                        setValue('feePerUnit', feePerByte);
                        setValue('feeLimit', feeLimit);
                    }
                }
                // or do nothing, use default composed tx
            }
        },
        [getValues, setValue],
    );

    return {
        switchToNearestFee,
    };
};
