import { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { FeeLevel } from 'trezor-connect';
import { useActions } from '@suite-hooks';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import { createDeferred, Deferred } from '@suite-utils/deferred';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { toFiatCurrency } from '@wallet-utils/fiatConverterUtils';
import { FormState, SendContextProps, SendContextState, Output } from '@wallet-types/sendForm';

export const SendContext = createContext<SendContextState | null>(null);
SendContext.displayName = 'SendContext';

// export const usePropsHook = () => {
//     const device = useSelector(state => state.suite.device);
//     const selectedAccount = useSelector(state => state.wallet.selectedAccount);
//     const fees = useSelector(state => state.wallet.fees);
//     const fiat = useSelector(state => state.wallet.fiat);
//     const localCurrency = useSelector(state => state.wallet.settings.localCurrency);

//     return {
//         device,
//         selectedAccount,
//         fees,
//         fiat,
//         localCurrency,
//     };
// };

const DEFAULT_VALUES = {
    txType: 'regular',
    setMaxOutputId: undefined,
    selectedFee: undefined,
    feePerUnit: '',
    feeLimit: '',
    bitcoinLockTime: '',
    ethereumGasPrice: '',
    ethereumGasLimit: '',
    ethereumData: '',
    rippleDestinationTag: '',
    outputs: [
        {
            outputId: 0,
            address: '',
            amount: '',
            fiat: '',
            currency: { value: 'usd', label: 'USD' },
        },
    ],
} as const;

const getDefaultValues = (currency: Output['currency']) => {
    return {
        ...DEFAULT_VALUES,
        outputs: [{ ...DEFAULT_VALUES.outputs[0], currency }],
    };
};

// composeTransaction should be debounced from both sides
// first: `timeout` prevents from calling 'trezor-connect' method to many times (inputs mad-clicking)
// second: `dfd` prevents from processing outdated results from 'trezor-connect' (timeout was resolved correctly but 'trezor-connect' method waits too long to respond while another "compose" was called)
const useComposeDebounced = () => {
    const timeout = useRef<ReturnType<typeof setTimeout>>(-1);
    const dfd = useRef<Deferred<boolean> | null>(null);

    const composeDebounced = useCallback(
        async <F extends (...args: any) => Promise<any>>(
            fn: F,
            useTimeout = true,
        ): Promise<ReturnType<F>> => {
            // clear previous timeout
            if (timeout.current >= 0) clearTimeout(timeout.current);
            // set new timeout
            if (useTimeout) {
                const timeoutDfd = createDeferred();
                const newTimeout = setTimeout(timeoutDfd.resolve, 300);
                timeout.current = newTimeout;
                await timeoutDfd.promise;
            }
            timeout.current = -1; // reset timeout

            // reject previous pending call, do not process results from trezor-connect
            if (dfd.current) dfd.current.resolve(false);

            // set new pending call
            const pending = createDeferred<boolean>();
            dfd.current = pending;

            // call compose function
            const result = await fn();
            pending.resolve(true); // try to unlock, it could be already resolved tho (see: dfd.resolve above)
            const shouldBeProcessed = await pending.promise; // catch potential rejection
            dfd.current = null; // reset dfd
            if (!shouldBeProcessed) throw new Error('ignored');
            return result;
        },
        [timeout, dfd],
    );

    return {
        composeDebounced,
    };
};

// const findErrors = (errors: any) => {
//     let hasErrors = false;
//     Object.keys(errors).forEach(key => {
//         const val = errors[key];
//         if (val) {
//             if (Array.isArray(val)) {
//                 val.forEach(output => findErrors(output));
//                 // findErrors
//             } else {
//                 val.type !==
//             }

//         }
//         // if (!val)

//         if (key === 'outputs') {
//             errors.output;
//         } else {
//         }
//     });
// };

// Mounted in top level index: @wallet-views/send
// returned ContextState is a object provided as SendContext values with custom callbacks for updating/resetting state
export const useSendForm = (props: SendContextProps): SendContextState => {
    // public variables, exported to SendFormContext
    const [state, setState] = useState(props);
    const [composedLevels, setComposedLevels] = useState<SendContextState['composedLevels']>(
        undefined,
    );

    // private variables, used inside sendForm hook
    const draft = useRef<FormState | undefined>(undefined);
    const composeRequest = useRef<string | undefined>(undefined);
    const [composeField, setComposeField] = useState<string | undefined>(undefined);
    const { composeDebounced } = useComposeDebounced();
    const { getDraft, saveDraft, removeDraft, composeTransaction, signTransaction } = useActions({
        getDraft: sendFormActions.getDraft,
        saveDraft: sendFormActions.saveDraft,
        removeDraft: sendFormActions.removeDraft,
        composeTransaction: sendFormActions.composeTransactionNew,
        signTransaction: sendFormActions.signTransaction,
    });

    const { localCurrencyOption } = state;

    // register `react-hook-form`, default values are set later in "loadDraft" useEffect block
    const useFormMethods = useForm<FormState>({ mode: 'onChange' });

    const { control, reset, register, getValues, errors, setValue, setError } = useFormMethods;

    // register custom form fields (without HTMLElement)
    useEffect(() => {
        register({ name: 'txType', type: 'custom' });
        register({ name: 'setMaxOutputId', type: 'custom' });
        register({ name: 'selectedFee', type: 'custom' });
    }, [register]);

    // register array fields (outputs array in react-hook-form)
    const outputsFieldArray = useFieldArray<Output>({
        control,
        name: 'outputs',
    });

    // load draft from reducer
    // TODO: load "remembered" fee level
    useEffect(() => {
        const stored = getDraft();
        const formState = stored ? stored.formState : {};
        const values = {
            ...getDefaultValues(localCurrencyOption),
            ...formState,
        };
        reset(values);

        if (stored) {
            draft.current = stored.formState;
        }
    }, [localCurrencyOption, getDraft, getValues, reset]);

    // TODO: useEffect on props (check: account change: key||balance, fee change, fiat change)
    // useEffect(() => {
    //     console.warn('SET BALANCE', account.balance);
    // }, [account.balance]);

    // // save initial selected fee to reducer
    // useEffect(() => {
    //     setLastUsedFeeLevel(initialSelectedFee.label, symbol);
    // }, [setLastUsedFeeLevel, initialSelectedFee, symbol]);

    // TODO: handle "composedLevels" change, set errors || success
    // const { composedLevels } = sendState;
    // useEffect(() => {
    //     console.warn('composedLevels', composedLevels);
    // }, [composedLevels]);

    // update custom values
    const updateContext = useCallback(
        (value: Partial<SendContextProps>) => {
            setState({
                ...state,
                ...value,
            });
            console.warn('updateContext', value, state);
        },
        [state],
    );

    const resetContext = useCallback(() => {
        setComposedLevels(undefined);
        removeDraft();
        setState(props); // resetting state will trigger "load draft" hook which will reset FormState
    }, [props, removeDraft]);

    const { feeInfo } = state;
    const composeDraft = useCallback(
        async (values: FormState) => {
            // start composing without debounce
            updateContext({ isLoading: true });
            setComposedLevels(undefined);
            const result = await composeTransaction(values, feeInfo);
            setComposedLevels(result);
            updateContext({ isLoading: false });
        },
        [feeInfo, composeTransaction, updateContext],
    );

    // called from Address/Amount/Fiat/CustomFee onChange events
    const composeOnChange = useCallback(async () => {
        const composeInner = async () => {
            if (Object.keys(errors).length > 0) return;
            // save draft
            const values = getValues();
            saveDraft(values);
            return composeTransaction(values, state.feeInfo);
        };

        try {
            const result = await composeDebounced(composeInner);
            if (result) {
                // set new composed transactions
                setComposedLevels(result);
            }
            // result undefined: (FormState got errors or sendFormActions got errors)
            updateContext({ isLoading: false });
        } catch (error) {
            // error should be thrown ONLY when response from trezor-connect shouldn't be processes (see composeDebounced hook)
        }
    }, [state, updateContext, composeDebounced, errors, getValues, saveDraft, composeTransaction]);

    const { fiatRates } = state;
    const calculateFiat = useCallback(
        (outputIndex: number, amount?: string) => {
            const values = getValues();
            const { fiat } = values.outputs[outputIndex];
            if (typeof fiat !== 'string') return; // fiat input not registered
            if (!amount) {
                // reset fiat value (Amount has error)
                if (fiat.length > 0) {
                    setValue(`outputs[${outputIndex}].fiat`, '', { shouldValidate: true });
                }
                return;
            }
            if (!fiatRates || !fiatRates.current) return;
            const selectedCurrency = values.outputs[outputIndex].currency;
            const fiatValue = toFiatCurrency(
                amount,
                selectedCurrency.value,
                fiatRates.current.rates,
            );
            if (fiatValue) {
                setValue(`outputs[${outputIndex}].fiat`, fiatValue, { shouldValidate: true });
            }
        },
        [getValues, setValue, fiatRates],
    );

    // handle draft change
    useEffect(() => {
        if (!draft.current) return;
        composeDraft(draft.current);
        draft.current = undefined;
    }, [draft, composeDraft]);

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
                setValue('selectedFee', nearest);
                if (nearest === 'custom') {
                    // @ts-ignore: type = error already filtered above
                    setValue('feePerUnit', composed.feePerByte);
                }
            }
            // or do nothing, use default composed tx
        }

        // composed transaction has error
        if (!composed || composed.type === 'error') {
            if (composeField) {
                // setError to the field which created `composeRequest`
                setError(composeField, {
                    type: 'compose',
                    message: 'TR_AMOUNT_IS_NOT_ENOUGH',
                });
            } else {
                // setError to the all `Amount` fields, composeField not specified (load draft case)
                values.outputs.forEach((_, i) => {
                    setError(`outputs[${i}].amount`, {
                        type: 'compose',
                        message: 'TR_AMOUNT_IS_NOT_ENOUGH',
                    });
                });
            }
            return;
        }

        // set calculated "max" value to `Amount` input
        if (typeof setMaxOutputId === 'number') {
            const amount = formatNetworkAmount(composed.max, state.account.symbol);
            setValue(`outputs[${setMaxOutputId}].amount`, amount, {
                shouldValidate: true,
                shouldDirty: true,
            });
            calculateFiat(setMaxOutputId, amount);
            // TODO: save draft
        }
    }, [
        composeField,
        composedLevels,
        getValues,
        setValue,
        setError,
        state.account.symbol,
        calculateFiat,
    ]);

    const changeFeeLevel = useCallback(
        (currentLevel: FeeLevel, newLevel: FeeLevel['label']) => {
            const values = getValues();
            // catch first change to custom
            if (newLevel === 'custom' && !(values.feePerUnit || values.feePerUnit === '')) {
                setValue('feePerUnit', currentLevel.feePerUnit);
                // setValue('feeLimit', currentLevel.feeLimit);
                setValue('feeLimit', '1');
            }
            setValue('selectedFee', newLevel);
            control.reRender();
        },
        [getValues, setValue, control],
    );

    const addOutput = useCallback(() => {
        outputsFieldArray.append({
            ...DEFAULT_VALUES.outputs[0],
            currency: localCurrencyOption,
        });
    }, [localCurrencyOption, outputsFieldArray]);

    const removeOutput = useCallback(
        async (index: number) => {
            const values = getValues();
            const { setMaxOutputId } = values;
            if (setMaxOutputId === index) {
                // reset setMaxOutputId
                values.setMaxOutputId = undefined;
            }
            if (typeof setMaxOutputId === 'number' && setMaxOutputId > index) {
                // reduce setMaxOutputId
                values.setMaxOutputId = setMaxOutputId - 1;
            }
            // remove output at index
            values.outputs.splice(index, 1);
            // reset form state
            reset(values);
        },
        [getValues, reset],
    );

    const sign = useCallback(async () => {
        const values = getValues();
        const composedTx = composedLevels
            ? composedLevels[values.selectedFee || 'normal']
            : undefined;
        if (composedTx && composedTx.type === 'final') {
            // signTransaction > sign[COIN]Transaction > requestPush (modal with promise)
            const result = await signTransaction(composedTx);
            if (result) {
                resetContext();
            }
        }
    }, [getValues, composedLevels, signTransaction, resetContext]);

    // Create a compose request which should be processes in useEffect below
    // This method should be called from the UI (input.onChange, button.click ...)
    // react-hook-form doesn't propagate values right away and new values are available AFTER render tick
    // Trying to processing request right after `input.onChange` will process a inconsistent values (values are not propagated yet, working with "previous" state at this point)
    // ALSO this function doesn't have to be wrapped in useCallback since no component is using it as a hook dependency
    // it will be cleared by garbage collector (useCallback are not)
    const onComposeRequest = (field: string, fieldHasError = false) => {
        // reset precomposed transactions
        setComposedLevels(undefined);
        // do nothing if there are no requests running and field got an error (component knows own errors in `onChange` blocks before they are propagated)
        if (!state.isLoading && fieldHasError) return;
        // set field for later use in composedLevels change useEffect
        setComposeField(field);
        // start composing
        updateContext({ isLoading: true });
        // call compose after re-render
        composeRequest.current = field;
    };

    // Handle compose request
    useEffect(() => {
        // compose request is not set, do nothing
        if (!composeRequest.current) return;
        // TODO: check errors
        // TODO: check "compose" errors
        composeOnChange();
        composeRequest.current = undefined;
    }, [composeRequest, composeOnChange]);

    return {
        ...state,
        ...useFormMethods,
        outputs: outputsFieldArray.fields,
        composedLevels,
        addOutput,
        removeOutput,
        updateContext,
        resetContext,
        composeTransaction: onComposeRequest,
        signTransaction: sign,
        calculateFiat,
        changeFeeLevel,
    };
};

// Used across send form components
// Provide combined context of `react-hook-form` with custom values as SendContextState
export const useSendFormContext = () => {
    const ctx = useContext(SendContext);
    if (ctx === null) throw Error('useSendFormContext used without Context');
    return ctx;
};
