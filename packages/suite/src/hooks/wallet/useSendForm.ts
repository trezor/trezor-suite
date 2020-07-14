import { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react';
import { createDeferred, Deferred } from '@suite-utils/deferred';
// import { useSelector } from 'react-redux';
import { useForm, useFieldArray } from 'react-hook-form';
// import { SEND } from '@wallet-actions/constants';
import { useActions } from '@suite-hooks';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import { FormState, SendContextProps, SendContextState, Output } from '@wallet-types/sendForm';

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
    setMaxOutputId: -1, // it has to be a number ??? TODO: investigate, otherwise watch() will not catch change [1 > null | undefined]
    bitcoinLockTime: '',
    ethereumGasPrice: '',
    ethereumGasLimit: '',
    ethereumData: '',
    rippleDestinationTag: '',

    // txType: 'regular',
    outputs: [
        {
            address: '',
            amount: '',
            fiat: '',
            currency: { value: 'usd', label: 'USD' },
        },
    ],
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
    const { composeDebounced } = useComposeDebounced();

    const { localCurrencyOption } = props;

    const { getDraft, saveDraft, removeDraft, composeTransaction } = useActions({
        getDraft: sendFormActions.getDraft,
        saveDraft: sendFormActions.saveDraft,
        removeDraft: sendFormActions.removeDraft,
        composeTransaction: sendFormActions.composeTransactionNew,
    });

    // register `react-hook-form`
    const useFormMethods = useForm<FormState>({
        mode: 'onChange',
        defaultValues: {
            ...DEFAULT_VALUES,
            outputs: [
                {
                    ...DEFAULT_VALUES.outputs[0],
                    currency: localCurrencyOption,
                },
            ],
        },
    });

    const { control, reset, register, getValues, errors, setError, trigger } = useFormMethods;

    // register custom form values (without HTMLElement)
    useEffect(() => {
        register({ name: 'txType', type: 'custom' });
        register({ name: 'setMaxOutputId', type: 'custom' });
    }, [register]);

    // register array fields (outputs array in react-hook-form)
    const outputsFieldArray = useFieldArray<Output>({
        control,
        name: 'outputs',
    });

    // load draft from reducer
    // TODO: load "remembered" fee level
    useEffect(() => {
        const draft = getDraft();
        if (draft) {
            // merge current values with storage values
            reset({
                ...getValues(),
                ...draft.formState,
            });
        }
        console.warn('LOAD DRAFT!', draft);
    }, [getDraft, getValues, reset]);

    // TODO: useEffect on props (check: account change: key||balance, fee change, fiat change)
    // useEffect(() => {
    //     console.warn('SET BALANCE', account.balance);
    // }, [account.balance]);

    // TODO: exclude testnet from this hook
    // useEffect(() => {
    //     console.warn('SET FIAT', fiatRates.current);
    // }, [fiatRates.current]);

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
        setState(props);
        removeDraft();
        reset(DEFAULT_VALUES);
    }, [props, reset, removeDraft]);

    // called from Address/Amount/Fiat onChange events
    const compose = useCallback(
        async (outputId?: number, validateFields?: string | string[]) => {
            const composeInner = async () => {
                // do not compose if form has errors
                if (Object.keys(errors).length > 0) return;
                // collect form values
                const values = getValues();
                // save draft
                saveDraft(values);
                // outputs should have at least amount set
                const validOutputs = values.outputs
                    ? values.outputs.filter(o => o.amount !== '')
                    : [];
                // do not compose if there are no valid output
                if (validOutputs.length < 1) return;

                if (validateFields) {
                    // since values/errors of react-hook-form are propagated after useEffect (re-render)
                    // we need to double check related fields validation
                    // example: change Fiat value calls setValue on related Amount, possible `errors` will be set after re-render (they are not set at this point yet)
                    const result = await trigger(validateFields);
                    if (!result) return;
                }

                return composeTransaction(state, values);
            };

            // reset precomposed transactions
            if (state.composedLevels) updateContext({ composedLevels: undefined });
            const composedLevels = await composeDebounced(composeInner);
            // set new composed transactions
            updateContext({ composedLevels });

            setError(`outputs[${outputId}].amount`, {
                type: 'manual',
                message: 'TR_AMOUNT_IS_NOT_ENOUGH',
            });
        },
        [
            state,
            updateContext,
            composeDebounced,
            setError,
            errors,
            getValues,
            saveDraft,
            composeTransaction,
            trigger,
        ],
    );

    return {
        ...state,
        ...useFormMethods,
        outputs: outputsFieldArray.fields,
        addOutput: outputsFieldArray.append,
        removeOutput: outputsFieldArray.remove,
        updateContext,
        resetContext,
        composeTransaction: compose,
    };
};

// Used across send form components
// Provide combined context of `react-hook-form` with custom values as SendContextState
export const useSendFormContext = () => {
    const ctx = useContext(SendContext);
    if (ctx === null) throw Error('useSendFormContext used without Context');
    return ctx;
};
