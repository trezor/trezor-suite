import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { getFeeLevels } from '@suite-common/wallet-utils';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { CRYPTO_INPUT, OUTPUT_AMOUNT, UseStakeFormsProps } from 'src/types/wallet/stakeForms';

import { useStakeCompose } from './form/useStakeCompose';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { CONTRACT_ACCOUNTING_ADDRESS } from 'src/constants/suite/ethStaking';

import { signTransaction } from 'src/actions/wallet/stakeActions';
import {
    ClaimContextValues,
    ClaimFormState,
    PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { getStakeFormsDefaultValues } from 'src/utils/suite/stake';

const defaultValues = getStakeFormsDefaultValues({
    address: CONTRACT_ACCOUNTING_ADDRESS,
    ethereumStakeType: 'claim',
}) as ClaimFormState;

export const ClaimEthFormContext = createContext<ClaimContextValues | null>(null);
ClaimEthFormContext.displayName = 'ClaimEthFormContext';

export const useClaimEthForm = ({ selectedAccount }: UseStakeFormsProps): ClaimContextValues => {
    const dispatch = useDispatch();

    const localCurrency = useSelector(selectLocalCurrency);
    const fees = useSelector(state => state.wallet.fees);

    const { account, network } = selectedAccount;

    // TODO: Implement fee switcher
    const selectedFee = 'normal';

    const state = useMemo(() => {
        const coinFees = fees[account.symbol];
        const levels = getFeeLevels(account.networkType, coinFees);
        const feeInfo = { ...coinFees, levels };

        return {
            account,
            network,
            feeInfo,
            formValues: defaultValues,
        };
    }, [account, fees, network]);

    const methods = useForm<ClaimFormState>({
        mode: 'onChange',
        defaultValues,
    });

    const { register, formState, setValue, reset, getValues, clearErrors } = methods;

    // react-hook-form auto register custom form fields (without HTMLElement)
    useEffect(() => {
        register('outputs');
        register(CRYPTO_INPUT);
    }, [register]);

    const {
        isLoading: isComposing,
        composeRequest,
        composedLevels,
    } = useStakeCompose({
        ...methods,
        state,
    });

    const onCryptoAmountChange = useCallback(
        async (amount: string) => {
            setValue(OUTPUT_AMOUNT, amount || '', { shouldDirty: true });
            await composeRequest(CRYPTO_INPUT);
        },
        [composeRequest, setValue],
    );

    const onClaimChange = useCallback(
        async (amount: string) => {
            clearErrors([CRYPTO_INPUT]);
            setValue(CRYPTO_INPUT, amount, {
                shouldDirty: true,
                shouldValidate: true,
            });
            await onCryptoAmountChange(amount);
        },
        [clearErrors, onCryptoAmountChange, setValue],
    );

    const clearForm = useCallback(async () => {
        reset(defaultValues);
        await composeRequest(CRYPTO_INPUT);
    }, [composeRequest, reset]);

    // get response from TransactionReviewModal
    const signTx = useCallback(async () => {
        const values = getValues();
        const composedTx = composedLevels ? composedLevels[selectedFee] : undefined;
        if (composedTx && composedTx.type === 'final') {
            const result = await dispatch(
                signTransaction(values, composedTx as PrecomposedTransactionFinal),
            );

            if (result?.success) {
                clearForm();
            }
        }
    }, [getValues, composedLevels, dispatch, clearForm]);

    return {
        ...methods,
        account,
        network,
        formState,
        register,
        localCurrency,
        composedLevels,
        isComposing,
        selectedFee,
        clearForm,
        signTx,
        clearErrors,
        onClaimChange,
    };
};

export const useClaimEthFormContext = () => {
    const ctx = useContext(ClaimEthFormContext);
    if (ctx === null) throw Error('useClaimEthFormContext used without Context');
    return ctx;
};
