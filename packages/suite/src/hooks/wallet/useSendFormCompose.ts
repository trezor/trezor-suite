import { useState, useRef, useEffect, useCallback } from 'react';
import { FieldPath, UseFormReturn } from 'react-hook-form';
import {
    FormState,
    UseSendFormState,
    SendContextValues,
    ExcludedUtxos,
    PrecomposedTransaction,
    PrecomposedTransactionCardano,
    PrecomposedLevels,
    PrecomposedLevelsCardano,
} from '@suite-common/wallet-types';
import { useAsyncDebounce } from '@trezor/react-utils';
import { useActions, useTranslation } from 'src/hooks/suite';
import { isChanged } from 'src/utils/suite/comparisonUtils';
import * as sendFormActions from 'src/actions/wallet/sendFormActions';
import { findComposeErrors } from '@suite-common/wallet-utils';
import { FeeLevel } from '@trezor/connect';
import { TranslationKey } from 'src/components/suite/Translation';

type Props = UseFormReturn<FormState> & {
    state: UseSendFormState;
    excludedUtxos: ExcludedUtxos;
    account: UseSendFormState['account']; // account from the component props !== state.account
    updateContext: SendContextValues['updateContext'];
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
    setAmount: (index: number, amount: string) => void;
    targetAnonymity?: number;
    prison?: Record<string, unknown>;
};

// This hook should be used only as a sub-hook of `useSendForm`
export const useSendFormCompose = ({
    getValues,
    setValue,
    setError,
    formState: { errors, isDirty },
    clearErrors,
    state,
    account,
    excludedUtxos,
    updateContext,
    setLoading,
    setAmount,
    prison,
}: Props) => {
    const [composedLevels, setComposedLevels] =
        useState<SendContextValues['composedLevels']>(undefined);
    const [composeField, setComposeField] = useState<FieldPath<FormState> | undefined>(undefined);
    const [draftSaveRequest, setDraftSaveRequest] = useState(false);

    const { composeTransaction } = useActions({
        composeTransaction: sendFormActions.composeTransaction,
    });
    const { translationString } = useTranslation();

    const composeRequestRef = useRef<string | undefined>(undefined); // input name, caller of compose request
    const composeRequestID = useRef(0); // compose ID, incremented with every compose request

    const debounce = useAsyncDebounce();

    const composeDraft = useCallback(
        async (values: FormState) => {
            // start composing without debounce
            setLoading(true);
            setComposedLevels(undefined);

            const result = await composeTransaction(values, {
                account,
                network: state.network,
                feeInfo: state.feeInfo,
                excludedUtxos,
                prison,
            });

            setComposedLevels(result);
            setLoading(false);
        },
        [
            account,
            prison,
            excludedUtxos,
            state.network,
            state.feeInfo,
            composeTransaction,
            setLoading,
        ],
    );

    // called from composeRequest useEffect
    const processComposeRequest = useCallback(async () => {
        // eslint-disable-next-line require-await
        const composeInner = async () => {
            if (Object.keys(errors).length > 0) {
                return;
            }

            const values = getValues();
            // save draft (it could be changed later, after composing)
            setDraftSaveRequest(true);

            return composeTransaction(values, {
                account,
                network: state.network,
                feeInfo: state.feeInfo,
                excludedUtxos,
                prison,
            });
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
            setLoading(false);
        }
    }, [
        account,
        excludedUtxos,
        prison,
        state.network,
        state.feeInfo,
        setLoading,
        debounce,
        errors,
        getValues,
        composeTransaction,
    ]);

    // Create a compose request which should be processed in useEffect below
    // This function should be called from the UI (input.onChange, button.click etc...)
    // react-hook-form doesn't propagate values immediately. New calculated FormState is available until render tick
    // IMPORTANT NOTE: Processing request without useEffect will use outdated FormState values (FormState before input.onChange)
    // NOTE: this function doesn't have to be wrapped in useCallback since no component is using it as a hook dependency and it will be cleared by garbage collector (useCallback are not)
    const composeRequest = (field: FieldPath<FormState> | undefined = 'outputs.0.amount') => {
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
        setLoading(true);
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
        (composed: PrecomposedTransaction | PrecomposedTransactionCardano) => {
            const values = getValues();
            if (composed.type === 'error') {
                const { error, errorMessage } = composed;
                if (!errorMessage) {
                    // composed tx doesn't have an errorMessage (Translation props)
                    // this error is unexpected and should be handled in sendFormActions
                    console.warn('Compose unexpected error', error);
                    return;
                }

                const getErrorType = (translationKey: TranslationKey) => {
                    switch (translationKey) {
                        case 'TR_NOT_ENOUGH_ANONYMIZED_FUNDS_WARNING':
                            return 'anonymity';
                        case 'TR_NOT_ENOUGH_SELECTED':
                            return 'coinControl';
                        default:
                            return 'compose';
                    }
                };

                const formError = {
                    type: getErrorType(errorMessage.id),
                    message: translationString(errorMessage.id, errorMessage.values),
                };

                if (composeField) {
                    // setError to the field which created `composeRequest`
                    setError(composeField, formError);
                } else if (values.outputs) {
                    // setError to the all `Amount` fields, composeField not specified (load draft case)
                    values.outputs.forEach((_, i) => setError(`outputs.${i}.amount`, formError));
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
        [
            composeField,
            getValues,
            setAmount,
            errors,
            setError,
            clearErrors,
            setValue,
            translationString,
        ],
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
            const nearest = (Object.keys(composedLevels) as FeeLevel['label'][]).find(
                key => composedLevels[key].type !== 'error',
            );
            // switch to it
            if (nearest) {
                composed = composedLevels[nearest];
                setValue('selectedFee', nearest);
                if (nearest === 'custom') {
                    // @ts-expect-error: type = error already filtered above
                    const { feePerByte, feeLimit } = composed;
                    setValue('feePerUnit', feePerByte);
                    setValue('feeLimit', feeLimit || '');
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
                const level = {
                    ...composedLevels,
                    custom: prevLevel,
                } as
                    | (PrecomposedLevels & { custom: PrecomposedTransaction })
                    | (PrecomposedLevelsCardano & { custom: PrecomposedTransactionCardano });
                setComposedLevels(level);
            } else {
                const currentLevel = composedLevels[current || 'normal'];
                updateComposedValues(currentLevel);
            }
            setDraftSaveRequest(true);
        },
        [composedLevels, updateComposedValues],
    );

    // handle props.account change:
    // - update context state (state.account)
    // - compose transaction with new data
    useEffect(() => {
        if (
            !isChanged(
                { account: state.account },
                { account },
                { account: ['availableBalance', 'addresses', 'balance', 'misc', 'utxo'] }, // only check relevant properties, otherwise it might recompose the transaction unnecessarily
            )
        ) {
            return; // account didn't change
        }
        if (!isDirty) {
            // there was no interaction with the form, just update state.account
            updateContext({ account });
            return;
        }

        // reset precomposed transactions
        setComposedLevels(undefined);
        // set ref for later use in useEffect which handle composedLevels change
        composeRequestRef.current = 'outputs.0.amount';
        // set ref for later use in processComposeRequest function
        composeRequestID.current++;
        // clear errors from compose process
        const composeErrors = findComposeErrors(errors);
        if (composeErrors.length > 0) {
            clearErrors(composeErrors);
        }
        // start composing
        setLoading(true);
        updateContext({ account });
    }, [
        state.account,
        state.feeInfo.dustLimit,
        isDirty,
        account,
        clearErrors,
        errors,
        updateContext,
        setLoading,
    ]);

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
