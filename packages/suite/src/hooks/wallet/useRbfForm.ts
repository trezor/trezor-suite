import { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { FormState, SendContextValues } from '@wallet-types/sendForm';
import { useActions, useAsyncDebounce, useSelector } from '@suite-hooks';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import { getFeeLevels, findComposeErrors } from '@wallet-utils/sendFormUtils';
import { WalletAccountTransaction } from '@wallet-types';
import { useFees } from './form/useFees';

const getState = (tx: WalletAccountTransaction, finalize: boolean) => {
    // @ts-ignore TEMP
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const state = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
        fees: state.wallet.fees,
        // online: state.suite.online,
    }));
    if (state.selectedAccount.status !== 'loaded' || !tx.rbfParams) return;

    const { account, network } = state.selectedAccount;
    const coinFees = state.fees[account.symbol];
    const levels = getFeeLevels(account.networkType, coinFees);

    return {
        tx,
        account: {
            ...account,
            utxo: tx.rbfParams.utxo, // use only utxo from this tx
        },
        network,
        feeInfo: { ...coinFees, levels },
        formValues: {
            outputs: tx.rbfParams.outputs,
            selectedFee: undefined,
            options: finalize ? ['broadcast'] : ['bitcoinRBF', 'broadcast'],
            feePerUnit: '',
            feeLimit: '',
        },
    };
};

export const useRbf = (tx: WalletAccountTransaction, finalize: boolean) => {
    // local state variables
    const [state] = useState(getState(tx, finalize));
    const [isLoading, setLoading] = useState(false);
    const [composeRequestID, setComposeRequestID] = useState(0);
    const composeRequestIDRef = useRef(0); // compose ID, incremented with every compose request
    const [composedLevels, setComposedLevels] = useState<SendContextValues['composedLevels']>(
        undefined,
    );

    console.log('StATE OPTIONS', state);

    // actions
    const debounce = useAsyncDebounce();
    const { composeTransaction, signTransaction } = useActions({
        composeTransaction: sendFormActions.composeTransaction,
        signTransaction: sendFormActions.signTransaction,
    });

    // react-hook-form
    const useFormMethods = useForm<FormState>({ mode: 'onChange', shouldUnregister: false });
    const { reset, register, setValue, getValues, errors, clearErrors } = useFormMethods;

    // react-hook-form auto register custom form fields (without HTMLElement)
    useEffect(() => {
        register({ name: 'outputs', type: 'custom' });
        register({ name: 'selectedFee', type: 'custom' });
        register({ name: 'options', type: 'custom' });
    }, [register]);

    // react-hook-form reset, set default values
    useEffect(() => {
        // @ts-ignore TEMP formValues type
        reset(state?.formValues);
    }, [state, reset]);

    // compose process
    const compose = useCallback(async () => {
        if (!state) return;
        const composeInner = async () => {
            if (Object.keys(errors).length > 0) return;
            const values = getValues();
            // @ts-ignore: TEMP incomplete UseSendFormState
            const r = await composeTransaction(values, {
                account: state.account,
                network: state.network,
                feeInfo: state.feeInfo,
                baseFee: state.tx.fee,
            });
            return r;
        };
        const result = await debounce(composeInner);
        if (result) {
            setComposedLevels(result);
        }
    }, [composeTransaction, debounce, getValues, errors, state]);

    // update composeRequestID
    const composeRequest = useCallback(() => {
        composeRequestIDRef.current += 1;
        setComposeRequestID(composeRequestIDRef.current);
        // clear errors from previous compose process
        const composeErrors = findComposeErrors(errors);
        if (composeErrors.length > 0) {
            clearErrors(composeErrors);
        }
    }, [errors, clearErrors]);

    // handle composeRequestID change, trigger compose process
    useEffect(() => {
        setComposedLevels(undefined);
        setLoading(true);
        compose();
    }, [composeRequestID, compose]);

    // handle `finalize` change
    useEffect(() => {
        const rbfEnabled = (getValues('options') || []).includes('bitcoinRBF');
        if (finalize === rbfEnabled) {
            setValue('options', finalize ? ['broadcast'] : ['broadcast', 'bitcoinRBF']);
            composeRequest();
        }
    }, [finalize, getValues, setValue, composeRequest]);

    const setCustomComposedLevel = useCallback(
        (prev: FormState['selectedFee'], current: FormState['selectedFee']) => {
            if (!composedLevels) return;
            if (current === 'custom') {
                const prevLevel = composedLevels[prev || 'normal'];
                setComposedLevels({
                    ...composedLevels,
                    custom: prevLevel,
                });
            }
        },
        [composedLevels],
    );

    const { switchToNearestFee } = useFees({
        // @ts-ignore TEMP
        defaultValue: state.formValues?.selectedFee,
        // @ts-ignore TEMP
        feeInfo: state.feeInfo!,
        onChange: setCustomComposedLevel,
        composeRequest,
        ...useFormMethods,
    });

    useEffect(() => {
        // do nothing if there are no composedLevels
        if (!composedLevels) return;
        switchToNearestFee(composedLevels);
        setLoading(false);
    }, [composedLevels, switchToNearestFee]);

    // called from the UI, triggers signing process
    const sign = async () => {
        console.log('Sign tx', composedLevels);
        const values = getValues();
        const composedTx = composedLevels
            ? composedLevels[values.selectedFee || 'normal']
            : undefined;
        if (composedTx && composedTx.type === 'final') {
            // sign workflow in Actions:
            // signTransaction > sign[COIN]Transaction > requestPushTransaction (modal with promise decision)
            // updateContext({ isLoading: true });
            const result = await signTransaction(values, composedTx);
            // updateContext({ isLoading: false });
            if (result) {
                // resetContext();
            }
        }
    };

    const typedRegister = useCallback(<T>(rules?: T) => register(rules), [register]);

    return {
        ...state,
        isLoading,
        register: typedRegister,
        errors,
        getValues,
        setValue,
        composeRequest,
        composedLevels,
        sign,
    };
};

type RbfContextValues = ReturnType<typeof useRbf> & NonNullable<ReturnType<typeof getState>>;

export const RbfContext = createContext<RbfContextValues | null>(null);
RbfContext.displayName = 'RbfContext';

// Used across rbf form components
// Provide combined context of `react-hook-form` with custom values as RbfContextValues
export const useRbfContext = () => {
    const ctx = useContext(RbfContext);
    if (ctx === null) throw Error('useRbfContext used without Context');
    return ctx;
};
