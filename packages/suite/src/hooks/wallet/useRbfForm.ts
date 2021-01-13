import { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FormState } from '@wallet-types/sendForm';
import { useSelector } from '@suite-hooks';
import { getFeeLevels } from '@wallet-utils/sendFormUtils';
import { findChainedTransactions } from '@wallet-utils/transactionUtils';
import { networkAmountToSatoshi } from '@wallet-utils/accountUtils';
import { DEFAULT_PAYMENT, DEFAULT_VALUES } from '@wallet-constants/sendForm';
import { WalletAccountTransaction } from '@wallet-types';
import { useFees } from './form/useFees';
import { useCompose } from './form/useCompose';

const useRbfState = (tx: WalletAccountTransaction, finalize: boolean, currentState: boolean) => {
    const state = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
        fees: state.wallet.fees,
        transactions: state.wallet.transactions.transactions,
    }));
    // do not calculate if currentState is already set (prevent re-renders)
    if (state.selectedAccount.status !== 'loaded' || !tx.rbfParams || currentState) return;

    const { account, network } = state.selectedAccount;
    const coinFees = state.fees[account.symbol];
    const origRate = parseInt(tx.rbfParams.feeRate, 10);

    // increase FeeLevels for visual purpose (old rate + defined rate)
    // it will be decreased in sendFormAction before composing
    const levels = getFeeLevels(account.networkType, coinFees).map(l => ({
        ...l,
        feePerUnit: Number(parseInt(l.feePerUnit, 10) + origRate).toString(),
    }));

    // override Account data
    const rbfAccount = {
        ...account,
        // use only utxo from original tx
        utxo: tx.rbfParams.utxo,
        // make sure that the exact same change output will be picked by trezor-connect > hd-wallet during the tx compose process
        // fallback to default if change address is not present
        addresses: account.addresses
            ? {
                  ...account.addresses,
                  change: tx.rbfParams.changeAddress
                      ? [tx.rbfParams.changeAddress]
                      : account.addresses.change,
              }
            : undefined,
    };

    // transform original outputs
    const outputs = tx.rbfParams.outputs.flatMap(o => {
        if (o.type === 'change') return [];
        return [
            {
                ...DEFAULT_PAYMENT,
                address: o.address,
                amount: o.formattedAmount,
            },
        ];
    });

    // find chained transactions for current account
    const chainedTxs = findChainedTransactions(tx.txid, state.transactions).find(
        t => t.key === account.key,
    );

    let { baseFee } = tx.rbfParams;
    if (chainedTxs) {
        // increase baseFee, pay for all child chained transactions
        baseFee = chainedTxs.txs.reduce((f, ctx) => {
            // transformation to satoshi should not be here, addressed in another PR
            const fee = networkAmountToSatoshi(ctx.fee, account.symbol);
            return f + parseInt(fee, 10);
        }, baseFee);
    }

    const rbfParams = {
        ...tx.rbfParams,
        baseFee,
    };

    return {
        account: rbfAccount,
        network,
        feeInfo: {
            ...coinFees,
            levels,
            minFee: origRate + coinFees.minFee, // increase required minFee rate
        },
        chainedTxs,
        formValues: {
            ...DEFAULT_VALUES,
            outputs,
            selectedFee: undefined,
            options: finalize ? ['broadcast'] : ['bitcoinRBF', 'broadcast'],
            feePerUnit: '',
            feeLimit: '',
            rbfParams,
        } as FormState, // TODO: remove type casting (options string[])
    };
};

export const useRbf = (tx: WalletAccountTransaction, finalize: boolean) => {
    // local state
    const [state, setState] = useState<ReturnType<typeof useRbfState>>(undefined);

    // throttle state calculation
    const initState = useRbfState(tx, finalize, !!state);
    useEffect(() => {
        if (!state && initState) {
            setState(initState);
        }
    }, [state, initState]);

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
