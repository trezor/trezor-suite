import { useCallback, useEffect, useState } from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { Keyboard } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { D, pipe } from '@mobily/ts-belt';
import { useNavigation } from '@react-navigation/native';
import { isFulfilled } from '@reduxjs/toolkit';

import { Network, getDisplaySymbol, getNetwork } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    FeesRootState,
    SendRootState,
    WalletSettingsRootState,
    composeSendFormTransactionFeeLevelsThunk,
    selectAccountByKey,
    selectDeviceUnavailableCapabilities,
    selectIsAmountInSats,
    selectNetworkFeeInfo,
    selectSendFormDraftByKey,
    sendFormActions,
    updateFeeInfoThunk,
} from '@suite-common/wallet-core';
import { TokenAddress } from '@suite-common/wallet-types';
import { useForm } from '@suite-native/forms';
import {
    SendStackParamList,
    SendStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { TokensRootState, selectAccountTokenInfo } from '@suite-native/tokens';
import { useDebounce } from '@trezor/react-utils';

import { useSubscribeForSolanaBlockUpdates } from '../hooks/useSubscribeForSolanaBlockUpdates';
import { storeFeeLevels } from '../sendFormSlice';
import { calculateFeeLevelsMaxAmountThunk } from '../sendFormThunks';
import { SendOutputsFormValues, sendOutputsFormValidationSchema } from '../sendOutputsFormSchema';
import { FeeLevelsMaxAmount } from '../types';
import { constructFormDraft } from '../utils';

const getDefaultValues = ({
    tokenContract,
    isDestinationTagEnabled,
}: {
    tokenContract?: TokenAddress;
    isDestinationTagEnabled: boolean;
}): Readonly<SendOutputsFormValues> =>
    ({
        isDestinationTagEnabled,
        outputs: [
            {
                amount: '',
                address: '',
                fiat: '',
                token: tokenContract ?? null,
            },
        ],
    }) as const;

const useSendForm = (
    accountKey: string,
    tokenContract?: TokenAddress,
): {
    handleSubmitSendForm: () => void;
    form: UseFormReturn<SendOutputsFormValues>;
    network: Network | null;
    amount: string | undefined;
} | null => {
    const dispatch = useDispatch();
    const debounce = useDebounce();
    const navigation =
        useNavigation<StackNavigationProps<SendStackParamList, SendStackRoutes.SendOutputs>>();

    const [feeLevelsMaxAmount, setFeeLevelsMaxAmount] = useState<FeeLevelsMaxAmount>();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const tokenInfo = useSelector((state: TokensRootState) =>
        selectAccountTokenInfo(state, accountKey, tokenContract),
    );

    const isAmountInSats = useSelector((state: WalletSettingsRootState) =>
        selectIsAmountInSats(state, account?.symbol),
    );
    const networkFeeInfo = useSelector((state: FeesRootState) =>
        selectNetworkFeeInfo(state, account?.symbol),
    );
    const sendFormDraft = useSelector((state: SendRootState) =>
        selectSendFormDraftByKey(state, accountKey, tokenContract),
    );

    useSubscribeForSolanaBlockUpdates(account);

    const deviceUnavailableCapabilities = useSelector(selectDeviceUnavailableCapabilities);

    const network = account ? getNetwork(account.symbol) : null;

    const form = useForm<SendOutputsFormValues>({
        validation: sendOutputsFormValidationSchema,
        // If the form is prefilled with the draft values, we want to revalidate the draft on every change.
        mode: sendFormDraft ? 'onChange' : 'onTouched',
        context: {
            networkFeeInfo,
            accountDescriptor: account?.descriptor,
            symbol: account?.symbol,
            availableBalance: tokenInfo?.balance ?? account?.availableBalance,
            isTokenFlow: !!tokenContract,
            isValueInSats: isAmountInSats,
            feeLevelsMaxAmount,
            decimals: tokenInfo?.decimals ?? network?.decimals,
            isTaprootAvailable: !deviceUnavailableCapabilities?.taproot,
            accountNativeAvailableBalance: account?.availableBalance,
        },
        defaultValues: getDefaultValues({
            tokenContract,
            isDestinationTagEnabled:
                network?.networkType === 'ripple' || network?.networkType === 'stellar',
        }),
    });

    const { handleSubmit, control, getValues, setValue, trigger, setError } = form;
    const watchedFormValues = useWatch({ control });
    const watchedAddress = useWatch({ name: 'outputs.0.address', control });

    const updateFormState = useCallback(async () => {
        if (account && network && networkFeeInfo) {
            const response = await dispatch(
                composeSendFormTransactionFeeLevelsThunk({
                    formState: constructFormDraft({ formValues: getValues(), tokenContract }),
                    composeContext: {
                        account,
                        network,
                        feeInfo: networkFeeInfo,
                    },
                }),
            );

            if (isFulfilled(response)) {
                const isReserveError = pipe(
                    response.payload,
                    D.filter(
                        feeLevel =>
                            feeLevel.type === 'error' &&
                            feeLevel.error === 'AMOUNT_IS_LESS_THAN_RESERVE',
                    ),
                    D.isNotEmpty,
                );

                if (isReserveError) {
                    setError('outputs.0.amount', {
                        message: `Recipient account requires minimum reserve of 1 ${getDisplaySymbol(account.symbol)} to activate.`,
                    });
                }

                const normalFeeLevel = networkFeeInfo?.levels.find(
                    level => level.label === 'normal',
                );

                dispatch(
                    sendFormActions.storeDraft({
                        accountKey,
                        tokenContract,
                        formState: constructFormDraft({
                            formValues: getValues(),
                            tokenContract,
                            feeLevel: normalFeeLevel,
                        }),
                    }),
                );
            }
        }
    }, [
        accountKey,
        dispatch,
        getValues,
        tokenContract,
        account,
        network,
        networkFeeInfo,
        setError,
    ]);

    const calculateNormalFeeMaxAmount = useCallback(async () => {
        const response = await dispatch(
            calculateFeeLevelsMaxAmountThunk({
                formState: constructFormDraft({ formValues: getValues() }),
                accountKey,
            }),
        );

        if (isFulfilled(response)) {
            setFeeLevelsMaxAmount(response.payload);
        }
    }, [getValues, accountKey, dispatch]);

    useEffect(() => {
        const prefillValuesFromStoredDraft = async () => {
            if (sendFormDraft?.outputs) {
                // TODO: use reset() instead of setValue()
                setValue('outputs', sendFormDraft.outputs, { shouldTouch: true });
                setValue('destinationTag', sendFormDraft.destinationTag, {
                    shouldTouch: true,
                });
                // The max amount is equal to the total token balance for tokens. (fee is paid in mainnet currency)
                if (!tokenContract) await calculateNormalFeeMaxAmount();
                trigger();
            }
        };

        prefillValuesFromStoredDraft();
        // this effect should be triggered only for the first render to fill the form with the stored draft on entry.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Triggered for every change of watchedFormValues.
    useEffect(() => {
        debounce(updateFormState);
    }, [updateFormState, watchedFormValues, debounce]);

    useEffect(() => {
        // The max amount is equal to the total token balance for tokens. (fee is paid in mainnet currency)
        if (!tokenContract) calculateNormalFeeMaxAmount();
    }, [watchedAddress, calculateNormalFeeMaxAmount, networkFeeInfo, tokenContract]);

    // TODO: Fetch periodically. So if the user stays on the screen for a long time, the fee info is updated in the background.
    useEffect(() => {
        if (account) dispatch(updateFeeInfoThunk({ networkSymbol: account.symbol }));
    }, [account, dispatch]);

    if (!account || !networkFeeInfo) return null;

    const handleSubmitSendForm = handleSubmit(async values => {
        // Keyboard has to be dismissed here before navigating, so it's animation is not interfering with the animations on the FeesScreen.
        Keyboard.dismiss();

        if (!network) return;

        const response = await dispatch(
            composeSendFormTransactionFeeLevelsThunk({
                formState: constructFormDraft({ formValues: values, tokenContract }),
                composeContext: {
                    account,
                    network,
                    feeInfo: networkFeeInfo,
                },
            }),
        );

        if (isFulfilled(response)) {
            dispatch(storeFeeLevels({ feeLevels: response.payload }));
            navigation.navigate(SendStackRoutes.SendFees, {
                accountKey,
                tokenContract,
            });

            return;
        }
    });

    return {
        handleSubmitSendForm,
        form,
        network,
    };
};

export { useSendForm };
