import { createContext, useContext, useCallback, useState, useEffect } from 'react';
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

// Mounted in top level index: @wallet-views/send
// returned ContextState is a object provided as SendContext values with custom callbacks for updating/resetting state
export const useSendForm = (props: SendContextProps): SendContextState => {
    const [state, setState] = useState(props);

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

    const { control, reset, register, getValues } = useFormMethods;

    // register array fields (outputs array in react-hook-form)
    const outputs = useFieldArray<Output>({
        control,
        name: 'outputs',
    });

    // register custom form values (without HTMLElement)
    useEffect(() => {
        register({ name: 'txType', type: 'custom' });
        register({ name: 'setMaxOutputId', type: 'custom' });
    }, [register]);

    // load draft from reducer
    // TODO: load "remembered" fee level
    useEffect(() => {
        const draft = getDraft();
        if (draft) {
            // merge current values with storage values
            reset({
                ...getValues({ nest: true }),
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

    // save draft to reducer
    // const { dirty } = methods.formState;
    useEffect(() => {
        // TODO: calling to many times
        if (useFormMethods.formState.dirty && Object.keys(useFormMethods.errors).length === 0) {
            console.warn('SAVE DRAFT!', useFormMethods.getValues({ nest: true }));
            saveDraft(useFormMethods.getValues({ nest: true }));
        }
    });

    // update custom values
    const updateContext = useCallback(
        (value: Parameters<SendContextState['updateContext']>[0]) => {
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

    const compose = useCallback(
        async (outputId?: number) => {
            // TODO: check errors
            // TODO: check outputs (address + amount needs to be set)
            // TODO: debouncing
            console.warn('compose by', outputId);
            // sendContext.updateContext({ composedLevels: undefined });
            // const result = await composeTransaction(
            //     state,
            //     getValues({ nest: true }),
            // );
            // console.warn('compose hook result', result);
            // if (result) {
            //     // save precomposed tx to reducer
            //     // dispatch({ type: SEND.SAVE_PRECOMPOSED_TX, precomposedTx: result });
            //     sendContext.updateContext({ composedLevels: result });
            // }
        },
        // [state, getValues, composeTransaction],
        [],
    );

    // propagate all values to context
    const values = getValues({ nest: true });

    return {
        ...state,
        ...useFormMethods,
        values,
        outputs,
        getDraft,
        saveDraft,
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
