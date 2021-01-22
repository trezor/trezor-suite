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
    // TODO: params required by sendFormActions (not the whole UseSendFormState), refactor both in the next PR
    state?: {
        account: Account;
        utxo?: Account['utxo'];
        network: Network;
        feeInfo: FeeInfo;
    };
    defaultField?: string;
};

// shareable sub-hook used in useRbfForm and useSendForm (TODO)

export const useCompose = ({
    state,
    defaultField,
    getValues,
    setValue,
    errors,
    setError,
    clearErrors,
}: Props) => {
    const [isLoading, setLoading] = useState(false);
    const [composeRequestID, setComposeRequestID] = useState(0);
    const composeRequestIDRef = useRef(composeRequestID);
    const defaultFieldRef = useRef(defaultField || 'outputs[0].amount');
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
    // call sendFormAction with debounce
    const compose = useCallback(async () => {
        if (!state) return;
        const composeInner = async () => {
            if (Object.keys(errors).length > 0) return;
            const values = getValues();
            const result = await composeAction(values, state as UseSendFormState);
            return result;
        };

        setLoading(true);
        // store current request ID before async debounced process and compare it later. see explanation below
        const resultID = composeRequestIDRef.current;
        const result = await debounce(composeInner);
        // RACE-CONDITION NOTE:
        // resultID could be outdated when composeRequestID was updated by another upcoming/pending composeRequest and render tick didn't process it yet,
        // therefore another debounce process was not called yet to interrupt current one
        // unexpected result: `updateComposedValues` is trying to work with updated/newer FormState
        if (resultID !== composeRequestIDRef.current) return;
        if (result) {
            setComposedLevels(result);
        }
        setLoading(false);
    }, [composeAction, debounce, getValues, errors, state]);

    // update composeRequestID
    const composeRequest = useCallback(
        (field = defaultFieldRef.current) => {
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
        },
        [composeField, getValues, setValue, errors, setError, clearErrors],
    );

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
        },
        [composedLevels, updateComposedValues],
    );

    const switchToNearestFee = useCallback(
        (composedLevels: NonNullable<UseSendFormState['composedLevels']>) => {
            const { selectedFee, setMaxOutputId } = getValues();
            let composed = composedLevels[selectedFee || 'normal'];

            // selectedFee was not set yet (no interaction with Fees) and default (normal) fee tx is not valid
            // OR setMax option was used
            // try to switch to nearest possible composed transaction
            const shouldSwitch =
                !selectedFee || (typeof setMaxOutputId === 'number' && selectedFee !== 'custom');
            if (shouldSwitch && composed.type === 'error') {
                // find nearest possible tx
                const nearest = Object.keys(composedLevels)
                    .reverse()
                    .find(key => composedLevels[key].type !== 'error');
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

            // composed transaction does not exists (should never happen)
            if (!composed) return;

            updateComposedValues(composed);
        },
        [getValues, setValue, updateComposedValues],
    );

    // handle composeRequestID change, trigger compose process
    useEffect(() => {
        compose();
    }, [composeRequestID, compose]);

    // handle composedLevels change
    useEffect(() => {
        // do nothing if there are no composedLevels
        if (!composedLevels) return;
        switchToNearestFee(composedLevels);
    }, [composedLevels, switchToNearestFee]);

    // called from the UI, triggers signing process
    const signTransaction = () => {
        const values = getValues();
        const composedTx = composedLevels
            ? composedLevels[values.selectedFee || 'normal']
            : undefined;
        if (composedTx && composedTx.type === 'final') {
            // sign workflow in Actions:
            // signTransaction > sign[COIN]Transaction > requestPushTransaction (modal with promise decision)
            return signAction(values, composedTx);
        }
    };

    return {
        isLoading,
        composeRequest,
        composedLevels,
        onFeeLevelChange,
        signTransaction,
    };
};
