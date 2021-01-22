import { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FormState } from '@wallet-types/sendForm';
import { useSelector } from '@suite-hooks';
import { getFeeLevels } from '@wallet-utils/sendFormUtils';
import { DEFAULT_PAYMENT, DEFAULT_VALUES } from '@wallet-constants/sendForm';
import { WalletAccountTransaction } from '@wallet-types';
import { useFees } from './form/useFees';
import { useCompose } from './form/useCompose';

const useRbfState = (tx: WalletAccountTransaction, finalize: boolean) => {
    const state = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
        fees: state.wallet.fees,
    }));
    if (state.selectedAccount.status !== 'loaded' || !tx.rbfParams) return;

    const { account, network } = state.selectedAccount;
    const coinFees = state.fees[account.symbol];
    const levels = getFeeLevels(account.networkType, coinFees);

    return {
        account,
        utxo: tx.rbfParams.utxo, // use only utxo from original tx
        network,
        feeInfo: { ...coinFees, levels },
        formValues: {
            ...DEFAULT_VALUES,
            outputs: tx.rbfParams.outputs.map(o => ({ ...DEFAULT_PAYMENT, ...o })), // use outputs from original tx
            selectedFee: undefined,
            options: finalize ? ['broadcast'] : ['bitcoinRBF', 'broadcast'],
            feePerUnit: '',
            feeLimit: '',
            baseFee: tx.rbfParams.baseFee,
            prevTxid: tx.txid,
        } as FormState, // TODO: remove type casting (options string[])
    };
};

export const useRbf = (tx: WalletAccountTransaction, finalize: boolean) => {
    // local state
    const [state] = useState(useRbfState(tx, finalize));

    // react-hook-form
    const useFormMethods = useForm<FormState>({ mode: 'onChange', shouldUnregister: false });
    const { reset, register, setValue, getValues, errors } = useFormMethods;

    // react-hook-form auto register custom form fields (without HTMLElement)
    useEffect(() => {
        register({ name: 'outputs', type: 'custom' });
        register({ name: 'options', type: 'custom' });
    }, [register]);

    // react-hook-form reset, set default values
    useEffect(() => {
        reset(state?.formValues);
    }, [state, reset]);

    // sub-hook
    const {
        isLoading,
        composeRequest,
        composedLevels,
        onFeeLevelChange,
        signTransaction,
    } = useCompose({
        ...useFormMethods,
        state,
        defaultField: 'selectedFee',
    });

    // sub-hook
    const { changeFeeLevel } = useFees({
        defaultValue: state?.formValues.selectedFee,
        feeInfo: state?.feeInfo,
        onChange: onFeeLevelChange,
        composeRequest,
        ...useFormMethods,
    });

    // handle `finalize` change
    useEffect(() => {
        const rbfEnabled = (getValues('options') || []).includes('bitcoinRBF');
        if (finalize === rbfEnabled) {
            setValue('options', finalize ? ['broadcast'] : ['broadcast', 'bitcoinRBF']);
            composeRequest();
        }
    }, [finalize, getValues, setValue, composeRequest]);

    const typedRegister = useCallback(<T>(rules?: T) => register(rules), [register]);

    // state can be undefined (no account, should never happen)
    // ts requires at least account field to be present (validated by context type)
    const ctxState = state ? { ...state } : { account: undefined };

    return {
        ...ctxState,
        isLoading,
        register: typedRegister,
        errors,
        setValue,
        getValues,
        composedLevels,
        changeFeeLevel,
        signTransaction,
    };
};

// context accepts only valid state (non nullable account)
type RbfContextValues = ReturnType<typeof useRbf> & NonNullable<ReturnType<typeof useRbfState>>;

export const RbfContext = createContext<RbfContextValues | null>(null);
RbfContext.displayName = 'RbfContext';

// Used across rbf form components
// Provide combined context of `react-hook-form` with custom values as RbfContextValues
export const useRbfContext = () => {
    const ctx = useContext(RbfContext);
    if (ctx === null) throw Error('useRbfContext used without Context');
    return ctx;
};
