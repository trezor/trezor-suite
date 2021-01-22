import { useState, useRef, useEffect, useCallback } from 'react';
import { UseFormMethods } from 'react-hook-form';
import {
    FormState,
    UseSendFormState,
    SendContextValues,
    PrecomposedTransaction,
} from '@wallet-types/sendForm';
import { useActions, useAsyncDebounce } from '@suite-hooks';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import { findComposeErrors } from '@wallet-utils/sendFormUtils';

type Props = UseFormMethods<FormState> & {
    state: UseSendFormState;
    account: UseSendFormState['account']; // account from the component props !== state.account
    updateContext: SendContextValues['updateContext'];
    setAmount: (index: number, amount: string) => void;
};

// This hook should be used only as a sub-hook of `useSendForm`
export const useSendFormCompose = ({
    getValues,
    setValue,
    setError,
    errors,
    clearErrors,
    state,
    account,
    updateContext,
    setAmount,
}: Props) => {
    const [composedLevels, setComposedLevels] = useState<SendContextValues['composedLevels']>(
        undefined,
    );
    const composeRequestRef = useRef<string | undefined>(undefined); // input name, caller of compose request
    const composeRequestID = useRef(0); // compose ID, incremented with every compose request
    const [composeField, setComposeField] = useState<string | undefined>(undefined);
    const [draftSaveRequest, setDraftSaveRequest] = useState(false);

    const debounce = useAsyncDebounce();

    const { composeTransaction } = useActions({
        composeTransaction: sendFormActions.composeTransaction,
    });

    const composeDraft = useCallback(
        async (values: FormState) => {
            // start composing without debounce
            updateContext({ isLoading: true, isDirty: true });
            setComposedLevels(undefined);
            const result = await composeTransaction(values, state);
            setComposedLevels(result);
            updateContext({ isLoading: false, isDirty: true }); // isDirty needs to be set again, "state" is cached in updateContext callback
        },
        [state, composeTransaction, updateContext],
    );

    // called from composeRequest useEffect
    const processComposeRequest = useCallback(async () => {
        // eslint-disable-next-line require-await
        const composeInner = async () => {
            if (Object.keys(errors).length > 0) return;
            const values = getValues();
            // save draft (it could be changed later, after composing)
            setDraftSaveRequest(true);
            return composeTransaction(values, state);
        };

        // store current request ID before async debounced process and compare it later. see explanation below
        const resultID = composeRequestID.current;
        const result = await debounce(composeInner);
        // RACE-CONDITION NOTE:
        // resultID could be outdated when composeRequestID was updated by another upcoming/pending composeRequest and render tick didn't process it yet,
        // therefore another debounce process was not called yet to interrupt current one
        // unexpected result: `updateComposedValues` is trying to work with updated/newer FormState
        if (resultID === composeRequestID.current) {
            if (result) {
                // set new composed transactions
                setComposedLevels(result);
            }
            // result undefined: (FormState got errors or sendFormActions got errors)
            updateContext({ isLoading: false });
        }
    }, [state, updateContext, debounce, errors, getValues, composeTransaction]);

    // Create a compose request which should be processed in useEffect below
    // This function should be called from the UI (input.onChange, button.click etc...)
    // react-hook-form doesn't propagate values immediately. New calculated FormState is available until render tick
    // IMPORTANT NOTE: Processing request without useEffect will use outdated FormState values (FormState before input.onChange)
    // NOTE: this function doesn't have to be wrapped in useCallback since no component is using it as a hook dependency and it will be cleared by garbage collector (useCallback are not)
    const composeRequest = (field = 'outputs[0].amount') => {
        // reset precomposed transactions
        setComposedLevels(undefined);
        // set ref for later use in useEffect which handle composedLevels change
        composeRequestRef.current = field;
        // set ref for later use in processComposeRequest function
        composeRequestID.current++;
        // clear errors from compose process
        const composeErrors = findComposeErrors(errors);
        if (composeErrors.length > 0) {
            clearErrors(composeErrors);
        }
        // set state value for later use in updateComposedValues function
        setComposeField(field);
        // start composing
        updateContext({ isLoading: true, isDirty: true });
    };

    // Handle composeRequest
    useEffect(() => {
        // compose request is not set, do nothing
        if (!composeRequestRef.current) return;
        processComposeRequest();
        // reset compose request
        composeRequestRef.current = undefined;
    }, [composeRequestRef, processComposeRequest]);

    // update fields AFTER composedLevels change or selectedFee change (below)
    const updateComposedValues = useCallback(
        (composed: PrecomposedTransaction) => {
            const values = getValues();
            if (composed.type === 'error') {
                const { error, errorMessage } = composed;
                if (!errorMessage) {
                    // composed tx doesn't have an errorMessage (Translation props)
                    // this error is unexpected and should be handled in sendFormActions
                    console.warn('Compose unexpected error', error);
                    return;
                }

                if (composeField) {
                    // setError to the field which created `composeRequest`
                    setError(composeField, {
                        type: 'compose',
                        message: errorMessage as any, // setError types is broken? according to ts it accepts only strings, but object or react component could be used as well...
                    });
                } else if (values.outputs) {
                    // setError to the all `Amount` fields, composeField not specified (load draft case)
                    values.outputs.forEach((_, i) => {
                        setError(`outputs[${i}].amount`, {
                            type: 'compose',
                            message: errorMessage as any,
                        });
                    });
                }
                return;
            }

            const composeErrors = findComposeErrors(errors);
            if (composeErrors.length > 0) {
                clearErrors(composeErrors);
            }

            // update feeLimit field if present (calculated from ethereum data size)
            setValue('estimatedFeeLimit', composed.estimatedFeeLimit);

            const { setMaxOutputId } = values;
            // set calculated and formatted "max" value to `Amount` input
            if (typeof setMaxOutputId === 'number' && composed.max) {
                setAmount(setMaxOutputId, composed.max);
                setDraftSaveRequest(true);
            }
        },
        [composeField, getValues, setAmount, errors, setError, clearErrors, setValue],
    );

    // handle composedLevels change, setValues or errors for composeField
    useEffect(() => {
        // do nothing if there are no composedLevels
        if (!composedLevels) return;

        const values = getValues();
        const { selectedFee, setMaxOutputId } = values;
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
                setDraftSaveRequest(true);
            }
            // or do nothing, use default composed tx
        }

        // composed transaction does not exists (not going to happen?)
        if (!composed) {
            return;
        }

        updateComposedValues(composed);
    }, [composedLevels, getValues, setValue, updateComposedValues]);

    // called from the useFees sub-hook
    const onFeeLevelChange = useCallback(
        (prev: FormState['selectedFee'], current: FormState['selectedFee']) => {
            if (!composedLevels) return;
            if (current === 'custom') {
                // set custom level from previously selected level
                const prevLevel = composedLevels[prev || 'normal'];
                setComposedLevels({
                    ...composedLevels,
                    custom: prevLevel,
                });
            } else {
                const currentLevel = composedLevels[current || 'normal'];
                updateComposedValues(currentLevel);
            }
            updateContext({ isDirty: true });
            setDraftSaveRequest(true);
        },
        [composedLevels, updateComposedValues, updateContext],
    );

    // handle props.account change:
    // - update context state (state.account)
    // - compose transaction with new data
    useEffect(() => {
        if (state.account === account) return; // account didn't change
        if (!state.isDirty) {
            // there was no interaction with the form, just update state.account
            updateContext({ account });
            return;
        }

        // reset precomposed transactions
        setComposedLevels(undefined);
        // set ref for later use in useEffect which handle composedLevels change
        composeRequestRef.current = 'outputs[0].amount';
        // set ref for later use in processComposeRequest function
        composeRequestID.current++;
        // clear errors from compose process
        const composeErrors = findComposeErrors(errors);
        if (composeErrors.length > 0) {
            clearErrors(composeErrors);
        }
        // start composing
        updateContext({ account, isLoading: true });
    }, [state.account, state.isDirty, account, clearErrors, errors, updateContext]);

    return {
        composeDraft,
        composeRequest,
        draftSaveRequest,
        setDraftSaveRequest,
        composedLevels,
        setComposedLevels,
        onFeeLevelChange,
    };
};
