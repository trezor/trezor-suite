import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWatch } from 'react-hook-form';
import { Keyboard } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { D, pipe } from '@mobily/ts-belt';
import { useNavigation } from '@react-navigation/native';
import { isFulfilled, isRejected } from '@reduxjs/toolkit';

import {
    selectDeviceUnavailableCapabilities,
    selectIsDeviceRemembered,
} from '@suite-common/device';
import { getExcludedUtxos } from '@suite-common/transaction-search';
import { type NetworkType, getDisplaySymbol, getNetwork } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type FeesRootState,
    type SendRootState,
    type WalletSettingsRootState,
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
    type Account,
    type AccountKey,
    type FeeLevelLabel,
    type GeneralPrecomposedTransactionFinal,
    type TokenAddress,
    isFinalPrecomposedTransaction,
} from '@suite-common/wallet-types';
import {
    convertAmountUnitsToSubunits,
    formatNetworkAmount,
    getNetworkReserve,
} from '@suite-common/wallet-utils';
import { useAlert } from '@suite-native/alerts';
import { useForm } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import {
    AuthorizeDeviceStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type SendStackParamList,
    SendStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { signTransactionNativeThunk } from '@suite-native/send';
import { type TokensRootState, selectAccountTokenInfo } from '@suite-native/tokens';
import {
    type FeeLevelsMaxAmount,
    type NativeSendRootState,
    calculateFeeLevelsMaxAmountThunk,
    selectFeeLevels,
    transactionManagementActions,
    useSubscribeForSolanaBlockUpdates,
} from '@suite-native/transaction-management';
import { useDebounce } from '@trezor/react-utils';
import { TRANSPORT_ERROR } from '@trezor/transport-abstract';

import { selectDestinationTagFromDraft } from '../selectors';
import {
    type SendOutputsFormValues,
    sendOutputsFormValidationSchema,
} from '../sendOutputsFormSchema';
import { constructFormDraft } from '../utils';
import { useRequestDelayedNavigationToOutputsReview } from './useRequestDelayedNavigationToOutputsReview';
import { useShowDeviceDisconnectedAlert } from './useShowDeviceDisconnectedAlert';
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

type SendFormNavigationProp = StackToStackCompositeNavigationProps<
    SendStackParamList,
    SendStackRoutes.SendOutputs,
    RootStackParamList
>;

export const useSendForm = (accountKey: AccountKey, tokenContract?: TokenAddress) => {
    const dispatch = useDispatch();
    const debounce = useDebounce();
    const navigation = useNavigation<SendFormNavigationProp>();

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
                            selectedUtxos,
                        }),
                    }),
                );

                dispatch(
                    transactionManagementActions.storeFeeLevels({
                        feeLevels: response.payload,
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

    const destinationTag = useSelector((state: NativeSendRootState) =>
        selectDestinationTagFromDraft(state, accountKey, tokenContract),
    );
    const isViewOnlyDevice = useSelector(selectIsDeviceRemembered);
    const { showAlert } = useAlert();
    const showDeviceDisconnectedAlert = useShowDeviceDisconnectedAlert();

    const requestDelayedNavigationToOutputsReview = useRequestDelayedNavigationToOutputsReview({
        accountKey,
        tokenContract,
    });

    const feeLevels = useSelector(selectFeeLevels);

    const navigateToAddressReview = useCallback(
        ({ transaction }: { transaction: GeneralPrecomposedTransactionFinal }) => {
            navigation.navigate(SendStackRoutes.SendAddressReview, {
                accountKey,
                tokenContract,
                transaction,
            });
        },
        [accountKey, tokenContract, navigation],
    );

    const navigateToDestinationTagReview = useCallback(
        (params: { destinationTag: string; transaction: GeneralPrecomposedTransactionFinal }) => {
            navigation.navigate(SendStackRoutes.SendDestinationTagReview, {
                destinationTag: params.destinationTag,
                accountKey,
                tokenContract,
                transaction: params.transaction,
            });
        },
        [accountKey, navigation, tokenContract],
    );

    const startStellarSigningFlow = useCallback(
        ({ transaction }: { transaction: GeneralPrecomposedTransactionFinal }) => {
            // The first review entry of Stellar is neither a destination address nor a destination tag.
            // We need to wait for device button requests before navigating to the review screen.
            dispatch(
                signTransactionNativeThunk({
                    accountKey,
                    tokenContract,
                    feeLevel: transaction,
                }),
            ).then(signingResponse => {
                if (isRejected(signingResponse)) {
                    const errorCode = signingResponse.payload?.errorCode;
                    const message = signingResponse.payload?.message;

                    if (
                        errorCode === 'Failure_PinCancelled' || // User cancelled the pin entry on device
                        errorCode === 'Method_Cancel' || // User canceled the pin entry in the app UI.
                        errorCode === 'Failure_ActionCancelled' // User canceled the review on device OR device got locked before the review was finished.
                    ) {
                        navigation.popTo(SendStackRoutes.SendOutputs, {
                            accountKey,
                            tokenContract,
                        });

                        return;
                    }

                    if (
                        errorCode === 'Device_InvalidState' || // Incorrect Passphrase submitted.
                        errorCode === 'Method_Interrupted' // Passphrase modal closed.
                    ) {
                        showAlert({
                            title: <Translation id="modulePassphrase.featureAuthorizationError" />,
                            pictogramVariant: 'critical',
                            primaryButtonTitle: <Translation id="generic.buttons.close" />,
                            primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
                        });

                        return;
                    }

                    // Device disconnected during the review.
                    if (
                        message === TRANSPORT_ERROR.DEVICE_DISCONNECTED_DURING_ACTION ||
                        message === TRANSPORT_ERROR.UNEXPECTED_ERROR
                    ) {
                        if (isViewOnlyDevice) {
                            navigation.popTo(SendStackRoutes.SendOutputs, {
                                accountKey,
                                tokenContract,
                                postNavigationAction: 'deviceDisconnectedAlert',
                            });
                        } else {
                            showDeviceDisconnectedAlert();
                        }

                        return;
                    }

                    dispatch(sendFormActions.discardTransaction());
                    navigation.navigate(RootStackRoutes.AccountDetail, {
                        accountKey,
                        tokenContract,
                        closeActionType: 'back',
                    });
                }
            });

            requestDelayedNavigationToOutputsReview();
        },
        [
            dispatch,
            accountKey,
            tokenContract,
            requestDelayedNavigationToOutputsReview,
            navigation,
            showAlert,
            isViewOnlyDevice,
            showDeviceDisconnectedAlert,
        ],
    );

    if (!account || !networkFeeInfo) return null;

    const handleSubmitSendForm = handleSubmit(() => {
        Keyboard.dismiss();

        if (!network) return;

        const selectedFee: FeeLevelLabel = sendFormDraft?.selectedFee ?? 'normal';
        const selectedFeeLevelTransaction = feeLevels[selectedFee];
        if (!isFinalPrecomposedTransaction(selectedFeeLevelTransaction)) {
            return;
        }

        const { networkType } = network;

        switch (networkType) {
            case 'ripple': {
                if (destinationTag) {
                    navigateToDestinationTagReview({
                        destinationTag,
                        transaction: selectedFeeLevelTransaction,
                    });
                } else {
                    navigateToAddressReview({ transaction: selectedFeeLevelTransaction });
                }

                break;
            }
            case 'stellar': {
                startStellarSigningFlow({ transaction: selectedFeeLevelTransaction });

                break;
            }
            default: {
                navigateToAddressReview({ transaction: selectedFeeLevelTransaction });

                break;
            }
        }

        // In case that view only device is not connected, show connect screen first.
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
    });

    const amount = isAmountInSats
        ? getValues('outputs.0.amount')
        : convertAmountUnitsToSubunits(getValues('outputs.0.amount'), network?.decimals ?? 0);

    return {
        handleSubmitSendForm,
        form,
        network,
        amount,
        feeLevelsMaxAmount,
    };
};
