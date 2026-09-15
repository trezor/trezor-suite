import { useCallback } from 'react';
import { Keyboard } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isRejected } from '@reduxjs/toolkit';

import { useServices } from '@suite-common/dependency-injection';
import { selectIsDeviceRemembered } from '@suite-common/device';
import { selectDispatch } from '@suite-common/redux-utils';
import { getNetwork } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type SendRootState,
    type WalletSettingsRootState,
    selectAccountNetworkSymbol,
    selectIsAmountInSats,
    selectSendFormDraftByKey,
    sendFormActions,
    useResolveNamedAddress,
} from '@suite-common/wallet-core';
import {
    type AccountKey,
    type FeeLevelLabel,
    type GeneralPrecomposedTransactionFinal,
    type TokenAddress,
    isFinalPrecomposedTransaction,
} from '@suite-common/wallet-types';
import { useAlert } from '@suite-native/alerts';
import { BannerInline, Box } from '@suite-native/atoms';
import { useFormContext, useFormState, useWatch } from '@suite-native/forms';
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
import { type NativeSendRootState, selectFeeLevels } from '@suite-native/transaction-management';
import { TRANSPORT_ERROR } from '@trezor/transport-common';

import { SendOutputsScreenFooter } from './SendOutputsScreenFooter';
import { useRequestDelayedNavigationToOutputsReview } from '../hooks/useRequestDelayedNavigationToOutputsReview';
import { useShowDeviceDisconnectedAlert } from '../hooks/useShowDeviceDisconnectedAlert';
import { useUtxoSelection } from '../hooks/useUtxoSelection';
import { selectDestinationTagFromDraft } from '../selectors';
import { type SendOutputsFormValues } from '../sendOutputsFormSchema';
import { getSendFormAmountInSubunits } from '../utils';

type SendFormNavigationProp = StackToStackCompositeNavigationProps<
    SendStackParamList,
    SendStackRoutes.SendOutputs,
    RootStackParamList
>;

type NavigateToAddressReviewParams = {
    transaction: GeneralPrecomposedTransactionFinal;
};

type NavigateToDestinationTagReviewParams = {
    destinationTag: string;
    transaction: GeneralPrecomposedTransactionFinal;
};

type SendFormSubmissionSectionProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

export const SendFormSubmissionSection = ({
    accountKey,
    tokenContract,
}: SendFormSubmissionSectionProps) => {
    const navigation = useNavigation<SendFormNavigationProp>();
    const { dispatch } = useServices(selectDispatch);
    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const isAmountInSats = useSelector((state: WalletSettingsRootState) =>
        selectIsAmountInSats(state, networkSymbol ?? undefined),
    );
    const sendFormDraft = useSelector((state: SendRootState) =>
        selectSendFormDraftByKey(state, accountKey, tokenContract),
    );
    const destinationTag = useSelector((state: NativeSendRootState) =>
        selectDestinationTagFromDraft(state, accountKey, tokenContract),
    );
    const isViewOnlyDevice = useSelector(selectIsDeviceRemembered);
    const { totalSelectedAmount, selectedUtxos } = useUtxoSelection(accountKey);
    const feeLevels = useSelector(selectFeeLevels);
    const { control, handleSubmit } = useFormContext<SendOutputsFormValues>();
    const { isValid, isSubmitting } = useFormState({ control });
    const { showAlert } = useAlert();
    const showDeviceDisconnectedAlert = useShowDeviceDisconnectedAlert();
    const requestDelayedNavigationToOutputsReview = useRequestDelayedNavigationToOutputsReview({
        accountKey,
        tokenContract,
    });
    const address = useWatch({ name: 'outputs.0.address', control });
    const formAmount = useWatch({ name: 'outputs.0.amount', control }) ?? '';
    const network = networkSymbol ? getNetwork(networkSymbol) : null;
    const amount = getSendFormAmountInSubunits({
        amount: formAmount,
        decimals: network?.decimals ?? 0,
        isAmountInSats,
    });
    const { mode: namedAddressMode, isResolving } = useResolveNamedAddress(
        address ?? '',
        networkSymbol ?? undefined,
    );

    const isResolvingNamedAddress = namedAddressMode === 'forward' && isResolving;
    const isFeeReady = isFinalPrecomposedTransaction(feeLevels.normal);
    const isMissingUtxos =
        selectedUtxos.length > 0 && amount && totalSelectedAmount.isLessThan(amount);

    const navigateToAddressReview = useCallback(
        ({ transaction }: NavigateToAddressReviewParams) => {
            navigation.navigate(SendStackRoutes.SendAddressReview, {
                accountKey,
                tokenContract,
                transaction,
            });
        },
        [accountKey, tokenContract, navigation],
    );

    const navigateToDestinationTagReview = useCallback(
        ({
            destinationTag: destinationTagParam,
            transaction,
        }: NavigateToDestinationTagReviewParams) => {
            navigation.navigate(SendStackRoutes.SendDestinationTagReview, {
                destinationTag: destinationTagParam,
                accountKey,
                tokenContract,
                transaction,
            });
        },
        [accountKey, navigation, tokenContract],
    );

    const startStellarSigningFlow = useCallback(
        ({ transaction }: NavigateToAddressReviewParams) => {
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

    if (isMissingUtxos) {
        return (
            <Animated.View entering={FadeInDown} exiting={FadeOutDown}>
                <Box padding="sp16">
                    <BannerInline
                        intent="warning"
                        title={<Translation id="moduleSend.coinControl.notEnoughCoins" />}
                    />
                </Box>
            </Animated.View>
        );
    }

    if (!isValid || !isFeeReady || isResolvingNamedAddress) return null;

    return (
        <SendOutputsScreenFooter
            isSubmitting={isSubmitting}
            handleNavigateToReviewScreen={handleSubmitSendForm}
        />
    );
};
