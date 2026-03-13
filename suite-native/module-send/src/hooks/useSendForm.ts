import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWatch } from 'react-hook-form';
import { Keyboard } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { D, pipe } from '@mobily/ts-belt';
import { useNavigation } from '@react-navigation/native';
import { isFulfilled } from '@reduxjs/toolkit';

import { selectDeviceUnavailableCapabilities } from '@suite-common/device';
import { getExcludedUtxos } from '@suite-common/transaction-search';
import { NetworkType, getDisplaySymbol, getNetwork } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    FeesRootState,
    SendRootState,
    WalletSettingsRootState,
    composeSendFormTransactionFeeLevelsThunk,
    selectAccountByKey,
    selectConvertedNetworkFeeInfo,
    selectIsAmountInSats,
    selectIsNetworkReserveEnabled,
    selectSendFormDraftByKey,
    sendFormActions,
    updateFeeInfoThunk,
} from '@suite-common/wallet-core';
import {
    Account,
    AccountKey,
    GeneralPrecomposedTransactionFinal,
    TokenAddress,
    isFinalPrecomposedTransaction,
} from '@suite-common/wallet-types';
import {
    convertAmountUnitsToSubunits,
    formatNetworkAmount,
    getNetworkReserve,
} from '@suite-common/wallet-utils';
import { useForm } from '@suite-native/forms';
import {
    AuthorizeDeviceStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    SendStackParamList,
    SendStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { updateSelectedFeeLevelThunk } from '@suite-native/send';
import { TokensRootState, selectAccountTokenInfo } from '@suite-native/tokens';
import {
    FeeLevelsMaxAmount,
    NativeSendRootState,
    calculateFeeLevelsMaxAmountThunk,
    transactionManagementActions,
    useSubscribeForSolanaBlockUpdates,
} from '@suite-native/transaction-management';
import { useDebounce } from '@trezor/react-utils';

import { selectDestinationTagFromDraft } from '../selectors';
import { SendOutputsFormValues, sendOutputsFormValidationSchema } from '../sendOutputsFormSchema';
import { constructFormDraft } from '../utils';
import { useHandleOnDeviceTransactionReview } from './useHandleOnDeviceTransactionReview';
import { useRequestDelayedNavigationToOutputsReview } from './useRequestDelayedNavigationToOutputsReview';
import { useUtxoSelection } from './useUtxoSelection';

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

const getRippleReserve = (account: Account, networkType: NetworkType) => {
    const reserve =
        account.misc && 'reserve' in account.misc && account.misc.reserve
            ? account.misc.reserve
            : undefined;

    if (networkType !== 'ripple' || !reserve) return undefined;

    return formatNetworkAmount(reserve, account.symbol);
};

export const useSendForm = (accountKey: AccountKey, tokenContract?: TokenAddress) => {
    const dispatch = useDispatch();
    const debounce = useDebounce();
    const navigation = useNavigation<
        StackToStackCompositeNavigationProps<
            SendStackParamList,
            SendStackRoutes.SendOutputs,
            RootStackParamList
        >
    >();

    const { selectedUtxos } = useUtxoSelection(accountKey);

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
    const isNetworkReserveEnabled = useSelector((state: WalletSettingsRootState) =>
        selectIsNetworkReserveEnabled(state),
    );
    const networkFeeInfo = useSelector((state: FeesRootState) =>
        selectConvertedNetworkFeeInfo(state, account?.symbol),
    );
    const sendFormDraft = useSelector((state: SendRootState) =>
        selectSendFormDraftByKey(state, accountKey, tokenContract),
    );
    const destinationTag = useSelector((state: NativeSendRootState) =>
        selectDestinationTagFromDraft(state, accountKey, tokenContract),
    );

    const excludedUtxos = useMemo(
        () =>
            getExcludedUtxos({
                utxos: account?.utxo ?? [],
                anonymitySet: account?.addresses?.anonymitySet,
                dustLimit: networkFeeInfo?.dustLimit,
            }),
        [account?.utxo, account?.addresses?.anonymitySet, networkFeeInfo?.dustLimit],
    );

    useSubscribeForSolanaBlockUpdates(account);

    const deviceUnavailableCapabilities = useSelector(selectDeviceUnavailableCapabilities);

    const network = account ? getNetwork(account.symbol) : null;

    const networkReserve = account
        ? getNetworkReserve({
              symbol: account.symbol,
              contractAddress: tokenContract,
              isEnabled: isNetworkReserveEnabled,
          })
        : undefined;

    const rippleReserve =
        account && network ? getRippleReserve(account, network.networkType) : undefined;

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
            networkReserve,
            rippleReserve,
        },
        defaultValues: getDefaultValues({
            tokenContract,
            isDestinationTagEnabled:
                network?.networkType === 'ripple' || network?.networkType === 'stellar',
        }),
    });

    const { handleSubmit, control, getValues, trigger, setError } = form;
    const watchedFormValues = useWatch({ control });
    const watchedAddress = useWatch({ name: 'outputs.0.address', control });

    const updateFormState = useCallback(async () => {
        if (account && network && networkFeeInfo) {
            const response = await dispatch(
                composeSendFormTransactionFeeLevelsThunk({
                    formState: constructFormDraft({
                        formValues: getValues(),
                        tokenContract,
                        selectedUtxos,
                    }),
                    composeContext: {
                        account,
                        network,
                        feeInfo: networkFeeInfo,
                        excludedUtxos,
                    },
                }),
            );

            if (isFulfilled(response)) {
                const feeLevels = response.payload;

                const isReserveError = pipe(
                    feeLevels,
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

                dispatch(transactionManagementActions.storeFeeLevels({ feeLevels }));

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
                            selectedUtxos,
                        }),
                    }),
                );

                trigger();
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
        excludedUtxos,
        selectedUtxos,
        trigger,
    ]);

    const calculateNormalFeeMaxAmount = useCallback(async () => {
        const response = await dispatch(
            calculateFeeLevelsMaxAmountThunk({
                formState: constructFormDraft({ formValues: getValues(), selectedUtxos }),
                accountKey,
            }),
        );

        if (isFulfilled(response)) {
            setFeeLevelsMaxAmount(response.payload);
        }
    }, [getValues, accountKey, dispatch, selectedUtxos]);

    useEffect(() => {
        const prefillValuesFromStoredDraft = async () => {
            if (sendFormDraft?.outputs) {
                form.reset({
                    ...getDefaultValues({
                        tokenContract,
                        isDestinationTagEnabled:
                            network?.networkType === 'ripple' || network?.networkType === 'stellar',
                    }),
                    ...sendFormDraft,
                });

                // The max amount is equal to the total token balance for tokens. (fee is paid in mainnet currency)
                if (!tokenContract) await calculateNormalFeeMaxAmount();

                // We need to wait for the context to hydrate before validating the form with the draft values.
                setTimeout(() => {
                    trigger();
                }, 0);
            }
        };

        prefillValuesFromStoredDraft();
        // this effect should be triggered only for the first render to fill the form with the stored draft on entry.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Triggered for every change of watchedFormValues.
    useEffect(() => {
        debounce(updateFormState);
    }, [updateFormState, watchedFormValues, debounce, selectedUtxos, isNetworkReserveEnabled]);

    useEffect(() => {
        // The max amount is equal to the total token balance for tokens. (fee is paid in mainnet currency)
        if (!tokenContract) calculateNormalFeeMaxAmount();
    }, [
        watchedAddress,
        calculateNormalFeeMaxAmount,
        networkFeeInfo,
        tokenContract,
        isNetworkReserveEnabled,
    ]);

    // TODO: Fetch periodically. So if the user stays on the screen for a long time, the fee info is updated in the background.
    useEffect(() => {
        if (account) dispatch(updateFeeInfoThunk({ networkSymbol: account.symbol }));
    }, [account, dispatch]);

    const handleOnDeviceTransactionReview = useHandleOnDeviceTransactionReview({
        accountKey,
        tokenContract,
        transaction: null,
    });
    const requestDelayedNavigationToOutputsReview = useRequestDelayedNavigationToOutputsReview({
        accountKey,
        tokenContract,
    });

    if (!account || !networkFeeInfo) return null;

    // TODO(#25541): Phase 2-7 - Fee composition, default 'normal' fee, and navigation flow may change when collapsed fee card and bottom sheet are added to Send Outputs.
    const handleSubmitSendForm = handleSubmit(async values => {
        // Keyboard has to be dismissed here before navigating, so it's animation is not interfering with the animations on the FeesScreen.
        Keyboard.dismiss();

        if (!network) return;

        const response = await dispatch(
            composeSendFormTransactionFeeLevelsThunk({
                formState: constructFormDraft({ formValues: values, tokenContract, selectedUtxos }),
                composeContext: {
                    account,
                    network,
                    feeInfo: networkFeeInfo,
                    excludedUtxos,
                },
            }),
        );

        if (isFulfilled(response)) {
            const feeLevels = response.payload;
            const normalFeeLevel = networkFeeInfo?.levels.find(
                level => level.label === 'normal',
            );

            dispatch(transactionManagementActions.storeFeeLevels({ feeLevels }));
            dispatch(
                sendFormActions.storeDraft({
                    accountKey,
                    tokenContract,
                    formState: constructFormDraft({
                        formValues: values,
                        tokenContract,
                        feeLevel: normalFeeLevel,
                        selectedUtxos,
                    }),
                }),
            );
            dispatch(
                updateSelectedFeeLevelThunk({
                    accountKey,
                    tokenContract,
                    feeLevelLabel: 'normal',
                }),
            );

            const transaction = (feeLevels as Record<string, unknown>).normal as
                | GeneralPrecomposedTransactionFinal
                | undefined;
            if (!transaction || !isFinalPrecomposedTransaction(transaction)) {
                return;
            }

            const { networkType } = network;

            const tag = values.destinationTag ?? destinationTag;
            if (networkType === 'ripple' && tag) {
                navigation.navigate(SendStackRoutes.SendDestinationTagReview, {
                    destinationTag: tag,
                    accountKey,
                    tokenContract,
                    transaction,
                });
            } else if (networkType === 'stellar') {
                // The first review entry of Stellar is neither a destination address nor a destination tag.
                // We need to wait for device button requests before navigating to the review screen.
                handleOnDeviceTransactionReview(transaction);
                requestDelayedNavigationToOutputsReview();
            } else {
                navigation.navigate(SendStackRoutes.SendAddressReview, {
                    accountKey,
                    tokenContract,
                    transaction,
                });
            }

            navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
                screen: AuthorizeDeviceStackRoutes.DeviceConnectionGuard,
                params: {
                    onCancelNavigationTarget: {
                        name: RootStackRoutes.SendStack,
                        params: {
                            screen: SendStackRoutes.SendOutputs,
                            params: { accountKey, tokenContract },
                        },
                    },
                },
            });

            return;
        }
    });

    const amount = isAmountInSats
        ? getValues('outputs.0.amount')
        : convertAmountUnitsToSubunits(getValues('outputs.0.amount'), network?.decimals ?? 0);

    return {
        handleSubmitSendForm,
        form,
        network,
        amount,
    };
};
