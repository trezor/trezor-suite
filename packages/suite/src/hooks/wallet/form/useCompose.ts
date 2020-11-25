import { useEffect, useRef, useCallback, useState } from 'react';
import { UseFormMethods } from 'react-hook-form';
import { useActions, useAsyncDebounce } from '@suite-hooks';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import { findComposeErrors } from '@wallet-utils/sendFormUtils';
import {
    FormState,
    FeeInfo,
    UseSendFormState,
    SendContextValues,
    PrecomposedTransaction,
} from '@wallet-types/sendForm';
import { Account, Network } from '@wallet-types';

type Props = UseFormMethods<FormState> & {
    state?: {
        account: Account;
        network: Network;
        feeInfo: FeeInfo;
        baseFee?: string;
    };
};

// shareable sub-hook used in useRbfForm and useSendForm (TODO)

export const useCompose = ({
    state,
    getValues,
    setValue,
    errors,
    setError,
    clearErrors,
}: Props) => {
    const [isLoading, setLoading] = useState(false);
    const [composeRequestID, setComposeRequestID] = useState(0);
    const composeRequestIDRef = useRef(composeRequestID);
    const [composedLevels, setComposedLevels] = useState<SendContextValues['composedLevels']>(
        undefined,
    );
    const [composeField, setComposeField] = useState<string | undefined>(undefined);

    // actions
    const debounce = useAsyncDebounce();
    const { composeAction, signAction } = useActions({
        composeAction: sendFormActions.composeTransaction,
        signAction: sendFormActions.signTransaction,
    });

    // compose process
    const compose = useCallback(async () => {
        if (!state) return;
        const composeInner = async () => {
            if (Object.keys(errors).length > 0) return;
            const values = getValues();
            const r = await composeAction(values, state as UseSendFormState);
            return r;
        };
        const result = await debounce(composeInner);
        if (result) {
            setComposedLevels(result);
        }
    }, [composeAction, debounce, getValues, errors, state]);

    // update composeRequestID
    const composeRequest = useCallback(
        (field = 'outputs[0].amount') => {
            // reset precomposed transactions
            setComposedLevels(undefined);
            // set ref for later use in useEffect
            composeRequestIDRef.current += 1;
            setComposeRequestID(composeRequestIDRef.current);
            // clear errors from previous compose process
            const composeErrors = findComposeErrors(errors);
            if (composeErrors.length > 0) {
                clearErrors(composeErrors);
            }
            // set field value for later use in updateComposedValues
            setComposeField(field);
        },
        [errors, clearErrors],
    );

    // set custom level from previous selected level
    const setCustomComposedLevel = useCallback(
        (prev: FormState['selectedFee']) => {
            if (!composedLevels) return;
            const prevLevel = composedLevels[prev || 'normal'];
            setComposedLevels({
                ...composedLevels,
                custom: prevLevel,
            });
        },
        [composedLevels],
    );

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
            if (composed.feeLimit) {
                setValue('ethereumDataFeeLimit', composed.feeLimit);
            }
        },
        [composeField, getValues, setValue, errors, setError, clearErrors],
    );

    // handle composeRequestID change, trigger compose process
    useEffect(() => {
        setLoading(true);
        compose();
    }, [composeRequestID, compose]);

    // handle composedLevels change
    useEffect(() => {
        setLoading(false);
    }, [composedLevels]);

    // called from the UI, triggers signing process
    const signTransaction = async () => {
        const values = getValues();
        const composedTx = composedLevels
            ? composedLevels[values.selectedFee || 'normal']
            : undefined;
        if (composedTx && composedTx.type === 'final') {
            // sign workflow in Actions:
            // signTransaction > sign[COIN]Transaction > requestPushTransaction (modal with promise decision)
            setLoading(true);
            const result = await signAction(values, composedTx);
            setLoading(false);
            if (result) {
                // TODO resetContext();
            }
        }
    };

    return {
        isLoading,
        setLoading,
        composeRequest,
        composeRequestID,
        setComposeRequestID,
        compose,
        composedLevels,
        setComposedLevels,
        setCustomComposedLevel,
        updateComposedValues,
        signTransaction,
    };
};
