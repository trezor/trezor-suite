import { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react';
import { createDeferred, Deferred } from '@suite-utils/deferred';
// import { useSelector } from 'react-redux';
import { useForm, useFieldArray } from 'react-hook-form';
// import { SEND } from '@wallet-actions/constants';
import { useActions } from '@suite-hooks';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import { FormState, SendContextProps, SendContextState, Output } from '@wallet-types/sendForm';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { FeeLevel } from 'trezor-connect';

export const SendContext = createContext<SendContextState | null>(null);
SendContext.displayName = 'SendContext';

// export const usePropsHook = () => {
//     const device = useSelector(state => state.wallet.selectedAccount);
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
        async <F extends (...args: any) => Promise<any>>(fn: F): Promise<ReturnType<F>> => {
            // clear previous timeout
            if (timeout.current >= 0) clearTimeout(timeout.current);

            // set new timeout
            const timeoutDfd = createDeferred();
            const newTimeout = setTimeout(timeoutDfd.resolve, 300);
            timeout.current = newTimeout;
            await timeoutDfd.promise;
            timeout.current = -1; // reset timeout

            // reject previous pending call, do not process results from trezor-connect
            if (dfd.current) dfd.current.resolve(false);

            // set new pending call
            const pending = createDeferred<boolean>();
            dfd.current = pending;

            // call compose function
            const result = await fn();
            // function returns nothing (form state got errors or trezor-connect invalid params in sendFormActions)
            if (!result) return;

            pending.resolve(true); // try to unlock, it could be already resolved tho (see: dfd.resolve above)
            const shouldBeProcessed = await pending.promise; // catch potential rejection
            dfd.current = null; // reset dfd
            if (!shouldBeProcessed) return;
            return result;
        },
        [timeout, dfd],
    );

    return {
        composeDebounced,
    };
};

// Mounted in top level index: @wallet-views/send
// returned ContextState is a object provided as SendContext values with custom callbacks for updating/resetting state
export const useSendForm = (props: SendContextProps): SendContextState => {
    const [state, setState] = useState(props);
    const draft = useRef<FormState | undefined>(undefined);
    const [composeField, setComposeField] = useState<string | undefined>(undefined);
    const [composedLevels, setComposedLevels] = useState<SendContextState['composedLevels']>(
        undefined,
    );
    const { composeDebounced } = useComposeDebounced();

    const { localCurrencyOption } = state;

    const { getDraft, saveDraft, removeDraft, composeTransaction, signTransaction } = useActions({
        getDraft: sendFormActions.getDraft,
        saveDraft: sendFormActions.saveDraft,
        removeDraft: sendFormActions.removeDraft,
        composeTransaction: sendFormActions.composeTransactionNew,
        signTransaction: sendFormActions.signTransaction,
    });

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
            updateContext({ composedLevels: undefined, isLoading: true });
            setComposedLevels(undefined);
            const result = await composeTransaction(values, feeInfo);
            updateContext({ composedLevels: result, isLoading: false });
            setComposedLevels(result);
        },
        [feeInfo, composeTransaction, updateContext],
    );

    // called from Address/Amount/Fiat onChange events
    const composeOnChange = useCallback(
        async (field: string, validateFields?: string | string[]) => {
            const composeInner = async () => {
                // do not compose if form has errors
                console.warn('GOT ERROROS?', errors);
                // Object.keys(errors).forEach(key => {
                //     if (key === 'outputs') {

                //     }
                // })
                if (Object.keys(errors).length > 0) return;
                // collect form values
                const values = getValues();
                // save draft
                saveDraft(values);
                // outputs should have at least amount OR set-max set
                // const validOutputs = values.outputs
                //     ? values.outputs.filter(o => o.amount !== '')
                //     : [];
                // do not compose if there are no valid output
                // if (validOutputs.length < 1) return;

                if (validateFields) {
                    // since values/errors of react-hook-form are propagated after useEffect (re-render)
                    // we need to double check related fields validation
                    // example: change Fiat value calls setValue on related Amount, possible `errors` will be set after re-render (they are not set at this point yet)
                    // const result = await trigger(validateFields);
                    // if (!result) return;
                }

                return composeTransaction(values, state.feeInfo);
            };
            // reset precomposed transactions
            setComposeField(field);
            setComposedLevels(undefined);
            if (state.composedLevels) updateContext({ composedLevels: undefined, isLoading: true });
            const composedLevels = await composeDebounced(composeInner);

            if (!composedLevels) {
                // setError(field, {
                //     type: 'manual',
                //     message: 'TR_AMOUNT_IS_NOT_ENOUGH',
                // });
                return;
            }

            // set new composed transactions
            setComposedLevels(composedLevels);
            updateContext({ composedLevels, isLoading: false });

            const values = getValues();
            const selectedLevel = values.selectedFee || 'normal';
            const setMaxOutputId = getValues('setMaxOutputId');
            // if (typeof setMaxOutputId === 'number') {
            //     // process set-max result

            //     // collect form values
            //     const values = getValues();
            //     // save draft
            //     saveDraft(values);
            // }
        },
        [state, updateContext, composeDebounced, errors, getValues, saveDraft, composeTransaction],
    );

    // handle draft change
    useEffect(() => {
        if (!draft.current) return;
        composeDraft(draft.current);
        draft.current = undefined;
    }, [draft, composeDraft]);

    // handle composedLevels change, setValues or errors for composeField
    useEffect(() => {
        if (!composedLevels) return;
        const values = getValues();
        const { selectedFee, setMaxOutputId } = values;
        let composed = composedLevels[selectedFee || 'normal'];
        if (!selectedFee && composed.type === 'error') {
            // find nearest possible tx
            const nearest = Object.keys(composedLevels).find(
                key => composedLevels[key].type !== 'error',
            );
            if (nearest) {
                composed = composedLevels[nearest];
                setValue('selectedFee', nearest);
                if (nearest === 'custom') {
                    // @ts-ignore: type = error already filtered above
                    setValue('feePerUnit', composed.feePerByte);
                }
            } else {
                composed = { type: 'error', error: 'FOO' };
            }
        }

        if (typeof setMaxOutputId === 'number' && composeField) {
            if (!composed || composed.type === 'error') {
                setError(composeField, {
                    type: 'compose',
                    message: 'TR_AMOUNT_IS_NOT_ENOUGH',
                });
            } else {
                // TODO: recalc fiat
                setValue(
                    `outputs[0].amount`,
                    formatNetworkAmount(composed.max, state.network.symbol),
                    {
                        shouldValidate: true,
                        shouldDirty: true,
                    },
                );
            }
        }

        console.warn('---post composeTransaction', composeField, composedLevels, values, composed);

        // if ((!selectedFee || selectedFee === 'custom') && composedLevels.custom) {
        //     if (composedLevels.custom.type !== 'error') {
        //         setValue('selectedFee', 'custom');
        //         setValue('feePerUnit', composedLevels.custom.feePerByte);
        //         // setValue('feeLimit', selectedLevel.feeLimit);
        //     }
        // }
    }, [composeField, composedLevels, getValues, setValue, setError]);

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

    return {
        ...state,
        ...useFormMethods,
        outputs: outputsFieldArray.fields,
        composedLevels,
        addOutput,
        removeOutput,
        updateContext,
        resetContext,
        composeTransaction: composeOnChange,
        signTransaction: sign,
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
