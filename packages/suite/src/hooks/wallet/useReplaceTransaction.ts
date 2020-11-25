import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { FeeLevel } from 'trezor-connect';
import { FormState, SendContextValues } from '@wallet-types/sendForm';
import { useActions, useAsyncDebounce, useSelector } from '@suite-hooks';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import { getFeeLevels } from '@wallet-utils/sendFormUtils';
import { WalletAccountTransaction } from '@wallet-types';

export const useReplaceTransaction = (tx: WalletAccountTransaction) => {
    const props = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
        fees: state.wallet.fees,
        online: state.suite.online,
    }));

    const [composedLevels, setComposedLevels] = useState<SendContextValues['composedLevels']>(
        undefined,
    );
    const [params, setParams] = useState<any>(null);

    const debounce = useAsyncDebounce();
    const { composeTransaction, signTransaction } = useActions({
        composeTransaction: sendFormActions.composeTransaction,
        signTransaction: sendFormActions.signTransaction,
    });

    const useFormMethods = useForm<FormState>({
        mode: 'onChange',
        shouldUnregister: false,
    });
    const { reset, register, setValue, getValues, clearErrors, errors } = useFormMethods;

    // register custom form fields (without HTMLElement)
    useEffect(() => {
        register({ name: 'outputs', type: 'custom' });
        register({ name: 'selectedFee', type: 'custom' });
        register({ name: 'options', type: 'custom' });
    }, [register]);

    useEffect(() => {
        if (!params && tx.rbfParams && props.selectedAccount.status === 'loaded') {
            const { account, network } = props.selectedAccount;
            const coinFees = props.fees[account.symbol];
            const levels = getFeeLevels(account.networkType, coinFees);
            setParams({
                tx,
                account: {
                    ...account,
                    utxo: tx.rbfParams.utxo,
                },
                network,
                feeInfo: { ...coinFees, levels },
            });

            reset({
                // outputs: [
                //     {
                //         type: 'payment',
                //         address: 'tb1q430xadjlchkh3ytcmvckyr4lglsvl9juwaaq40',
                //         amount: '0.00010000',
                //     },
                // ],
                outputs: tx.rbfParams.outputs,
                selectedFee: undefined,
                options: ['bitcoinRBF', 'broadcast'],
                feePerUnit: '',
                feeLimit: '',
            });
        }
    }, [tx, props, reset, params]);

    useEffect(() => {
        if (!params) return;
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        composeRequest();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params]);

    const composeRequest = async () => {
        console.log('Compose tx', params);
        const composeInner = async () => {
            const values = getValues();
            // @ts-ignore: incomplete UseSendFormState
            const r = await composeTransaction(values, {
                account: params.account,
                network: params.network,
                feeInfo: params.feeInfo,
                baseFee: tx.fee,
            });
            return r;
        };
        const result = await debounce(composeInner);
        if (result) {
            setComposedLevels(result);
        }
    };

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

    const changeFeeLevel = useCallback(
        (currentLevel: FeeLevel, newLevel: FeeLevel) => {
            if (currentLevel.label === newLevel.label) return;
            setValue('selectedFee', newLevel.label);
            const isCustom = newLevel.label === 'custom';
            // catch first change to custom
            if (isCustom) {
                setValue('feePerUnit', currentLevel.feePerUnit);
                setValue('feeLimit', currentLevel.feeLimit);
            } else {
                // when switching from custom FeeLevel which has an error
                // this error should be cleared and transaction should be precomposed again
                // response is handled and used in @wallet-views/send/components/Fees (the caller of this function)
                const shouldCompose = errors.feePerUnit || errors.feeLimit;
                if (shouldCompose) {
                    clearErrors(['feePerUnit', 'feeLimit']);
                }
                setValue('feePerUnit', '');
                setValue('feeLimit', '');
                // setLastUsedFeeLevel(newLevel);
                return shouldCompose;
            }
        },
        [setValue, errors, clearErrors],
    );

    return {
        composeRequest,
        sign,
        changeFeeLevel,
    };
};
