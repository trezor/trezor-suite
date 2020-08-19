import { useState, useRef, useEffect, useCallback } from 'react';
import { UseFormMethods } from 'react-hook-form';
import { FeeLevel } from 'trezor-connect';
import { FormState, SendContextProps, SendContextState } from '@wallet-types/sendForm';
import { useActions, useDebounce } from '@suite-hooks';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import { findComposeErrors } from '@wallet-utils/sendFormUtils';

type Props = UseFormMethods<FormState> & {
    state: SendContextProps;
    updateContext: SendContextState['updateContext'];
    setAmount: any;
};

export const useSendFormCompose = ({
    watch,
    getValues,
    setValue,
    setError,
    errors,
    clearErrors,
    state,
    updateContext,
    setAmount,
}: Props) => {
    const [composedLevels, setComposedLevels] = useState<SendContextState['composedLevels']>(
        undefined,
    );
    const selectedFeeRef = useRef<FeeLevel['label'] | undefined>(undefined);
    const composeRequestRef = useRef<string | undefined>(undefined);
    const [composeField, setComposeField] = useState<string | undefined>(undefined);
    const [draftSaveRequest, setDraftSaveRequest] = useState(false);

    const { debounce } = useDebounce();

    const { composeTransaction } = useActions({
        composeTransaction: sendFormActions.composeTransaction,
    });

    const composeDraft = useCallback(
        async (values: FormState) => {
            // start composing without debounce
            updateContext({ isLoading: true });
            setComposedLevels(undefined);
            const result = await composeTransaction(values, state);
            setComposedLevels(result);
            updateContext({ isLoading: false });
        },
        [state, composeTransaction, updateContext],
    );

    // called from useEffect
    const processComposeRequest = useCallback(async () => {
        const composeInner = async () => {
            if (Object.keys(errors).length > 0) return;
            const values = getValues();
            // save draft (it could be changed later, after composing)
            setDraftSaveRequest(true);
            return composeTransaction(values, state);
        };

        try {
            const result = await debounce(composeInner);
            if (result) {
                // set new composed transactions
                setComposedLevels(result);
            }
            // result undefined: (FormState got errors or sendFormActions got errors)
            updateContext({ isLoading: false });
        } catch (error) {
            // error should be thrown ONLY when response from trezor-connect shouldn't be processes (see composeDebounced hook)
        }
    }, [state, updateContext, debounce, errors, getValues, composeTransaction]);

    // Create a compose request which should be processes in useEffect below
    // This method should be called from the UI (input.onChange, button.click ...)
    // react-hook-form doesn't propagate values right away and new values are available AFTER render tick
    // Trying to processing request right after `input.onChange` will process a inconsistent values (values are not propagated yet, working with "previous" state at this point)
    // ALSO this function doesn't have to be wrapped in useCallback since no component is using it as a hook dependency
    // it will be cleared by garbage collector (useCallback are not)
    const composeRequest = (field: string, fieldHasError = false) => {
        // reset precomposed transactions
        setComposedLevels(undefined);
        // do nothing if there are no requests running and field got an error (component knows own errors in `onChange` blocks before they are propagated)
        if (!state.isLoading && fieldHasError) return;
        const composeErrors = findComposeErrors(errors);
        if (composeErrors.length > 0) {
            clearErrors(composeErrors);
        }
        // set field for later use in composedLevels change useEffect
        // call compose after re-render
        composeRequestRef.current = field;
        setComposeField(field);
        // start composing
        updateContext({ isLoading: true });
    };

    // Handle composeRequest
    useEffect(() => {
        // compose request is not set, do nothing
        if (!composeRequestRef.current) return;
        // TODO: check errors
        // TODO: check "compose" errors
        processComposeRequest();
        composeRequestRef.current = undefined;
    }, [composeRequestRef, processComposeRequest]);

    // handle composedLevels change, setValues or errors for composeField
    useEffect(() => {
        // do nothing if there are no composedLevels
        if (!composedLevels) return;

        console.warn('---post composeTransaction', composeField, composedLevels);

        const values = getValues();
        const { selectedFee, setMaxOutputId } = values;
        let composed = composedLevels[selectedFee || 'normal'];

        // selectedFee was not set (no interaction with Fees yet) and default (normal) fee tx is not valid
        // try to switch to nearest possible composed transaction
        if (!selectedFee && composed.type === 'error') {
            // find nearest possible tx
            const nearest = Object.keys(composedLevels).find(
                key => composedLevels[key].type !== 'error',
            );
            // switch to it
            if (nearest) {
                composed = composedLevels[nearest];
                selectedFeeRef.current = nearest as FormState['selectedFee'];
                setValue('selectedFee', nearest);
                if (nearest === 'custom') {
                    // @ts-ignore: type = error already filtered above
                    const { feePerByte, feeLimit } = composed;
                    setValue('feePerUnit', feePerByte);
                    setValue('feeLimit', feeLimit);
                }
                setDraftSaveRequest(true);
            }
            // or do nothing, use default composed tx
        }

        // composed transaction has error
        if (!composed || composed.type === 'error') {
            if (composeField) {
                // setError to the field which created `composeRequest`
                setError(composeField, {
                    type: 'compose',
                    message: 'AMOUNT_IS_NOT_ENOUGH',
                });
            } else {
                // setError to the all `Amount` fields, composeField not specified (load draft case)
                values.outputs.forEach((_, i) => {
                    setError(`outputs[${i}].amount`, {
                        type: 'compose',
                        message: 'AMOUNT_IS_NOT_ENOUGH',
                    });
                });
            }
            return;
        }

        // update feeLimit field if present (calculated from ethereum data size)
        if (composed.feeLimit) {
            setValue('ethereumDataFeeLimit', composed.feeLimit);
        }

        // set calculated and formatted "max" value to `Amount` input
        if (typeof setMaxOutputId === 'number') {
            setAmount(setMaxOutputId, composed.max);
            setDraftSaveRequest(true);
        }
    }, [
        composeField,
        composedLevels,
        getValues,
        setValue,
        setError,
        state.account.symbol,
        setAmount, // TODO: check if this could be changed by props.fiatRate change?
    ]);

    // watch selectedFee change and update composedLevels or save draft
    const selectedFee = watch('selectedFee') as FormState['selectedFee'];
    useEffect(() => {
        if (!selectedFee || selectedFeeRef.current === selectedFee) return;
        if (selectedFee === 'custom' && composedLevels) {
            const prevLevel = composedLevels[selectedFeeRef.current || 'normal'];
            setComposedLevels({
                ...composedLevels,
                custom: prevLevel,
            });
        } else {
            setDraftSaveRequest(true);
        }
        selectedFeeRef.current = selectedFee;
    }, [composedLevels, selectedFee, setValue]);

    // TODO: useEffect on props (check: account change: key||balance, fee change, fiat change)
    // useEffect(() => {
    //     console.warn('SET BALANCE', account.balance);
    // }, [account.balance]);

    return {
        composeDraft,
        composeRequest,
        draftSaveRequest,
        setDraftSaveRequest,
        composedLevels,
        setComposedLevels,
    };
};
