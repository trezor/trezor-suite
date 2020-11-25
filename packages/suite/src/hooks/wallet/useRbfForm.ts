import { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FormState } from '@wallet-types/sendForm';
import { useSelector } from '@suite-hooks';
import { getFeeLevels } from '@wallet-utils/sendFormUtils';
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
        tx,
        account: {
            ...account,
            utxo: tx.rbfParams.utxo, // use only utxo from this tx
        },
        network,
        feeInfo: { ...coinFees, levels },
        baseFee: tx.fee,
        formValues: {
            outputs: tx.rbfParams.outputs,
            selectedFee: undefined,
            options: finalize ? ['broadcast'] : ['bitcoinRBF', 'broadcast'],
            feePerUnit: '',
            feeLimit: '',
        } as FormState,
    };
};

export const useRbf = (tx: WalletAccountTransaction, finalize: boolean) => {
    // local state variables
    const [state] = useState(useRbfState(tx, finalize));

    // react-hook-form
    const useFormMethods = useForm<FormState>({ mode: 'onChange', shouldUnregister: false });
    const { reset, register, setValue, getValues, errors } = useFormMethods;

    // react-hook-form auto register custom form fields (without HTMLElement)
    useEffect(() => {
        register({ name: 'outputs', type: 'custom' });
        register({ name: 'selectedFee', type: 'custom' });
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
        setCustomComposedLevel,
        signTransaction,
    } = useCompose({
        ...useFormMethods,
        state,
    });

    // handle fee level change (from useFees sub-hook)
    const onFeeChange = useCallback(
        (prev: FormState['selectedFee'], current: FormState['selectedFee']) => {
            if (current === 'custom') setCustomComposedLevel(prev);
        },
        [setCustomComposedLevel],
    );

    // sub-hook
    const { switchToNearestFee } = useFees({
        defaultValue: state?.formValues.selectedFee,
        feeInfo: state?.feeInfo,
        onChange: onFeeChange,
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

    // handle composedLevels change
    useEffect(() => {
        // do nothing if there are no composedLevels
        if (!composedLevels) return;
        switchToNearestFee(composedLevels);
    }, [composedLevels, switchToNearestFee]);

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
        sign: signTransaction,
    };
};

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
