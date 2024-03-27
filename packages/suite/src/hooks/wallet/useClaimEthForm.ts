import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { CRYPTO_INPUT, OUTPUT_AMOUNT, UseStakeFormsProps } from 'src/types/wallet/stakeForms';

import { signTransaction } from 'src/actions/wallet/stakeActions';
import { ClaimContextValues, ClaimFormState } from '@suite-common/wallet-types';
import { getEthNetworkForWalletSdk, getStakeFormsDefaultValues } from 'src/utils/suite/stake';
// @ts-expect-error
import { Ethereum } from '@everstake/wallet-sdk';
import { useCommonEthForm } from './useCommonEthForm';

export const ClaimEthFormContext = createContext<ClaimContextValues | null>(null);
ClaimEthFormContext.displayName = 'ClaimEthFormContext';

export const useClaimEthForm = ({ selectedAccount }: UseStakeFormsProps): ClaimContextValues => {
    const { account, network } = selectedAccount;

    const defaultValues = useMemo(() => {
        const { address_accounting: accountingAddress } = Ethereum.selectNetwork(
            getEthNetworkForWalletSdk(account.symbol),
        );

        return {
            ...getStakeFormsDefaultValues({
                address: accountingAddress,
                ethereumStakeType: 'claim',
            }),
        } as ClaimFormState;
    }, [account.symbol]);

    const {
        methods,
        clearForm,
        localCurrency,
        selectedFee,
        changeFeeLevel,
        isComposing,
        composedLevels,
        composeRequest,
        signTx,
        feeInfo,
    } = useCommonEthForm<ClaimFormState>({
        draftKey: 'stake-eth',
        defaultValues,
        selectedAccount,
        signTransaction,
    });
    const { register, formState, setValue, clearErrors } = methods;

    // react-hook-form auto register custom form fields (without HTMLElement)
    useEffect(() => {
        register('outputs');
        register(CRYPTO_INPUT);
    }, [register]);

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
        feeInfo,
        changeFeeLevel,
    };
};

export const useClaimEthFormContext = () => {
    const ctx = useContext(ClaimEthFormContext);
    if (ctx === null) throw Error('useClaimEthFormContext used without Context');

    return ctx;
};
