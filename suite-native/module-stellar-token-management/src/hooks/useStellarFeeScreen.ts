import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { isFulfilled } from '@reduxjs/toolkit';

import {
    DeviceRootState,
    selectDeviceButtonRequestsCodes,
    selectIsDeviceConnectedAndAuthorized,
} from '@suite-common/device';
import {
    AccountsRootState,
    FormDraftRootState,
    fetchAndUpdateAccountThunk,
    selectAccountByKey,
    selectDeepCopyOfFormDraft,
} from '@suite-common/wallet-core';
import {
    AccountKey,
    FeeLevelLabel,
    FormState,
    PrecomposedTransactionFinal,
    TokenAddress,
    isFinalPrecomposedTransaction,
} from '@suite-common/wallet-types';
import { useAlert } from '@suite-native/alerts';
import { useBottomSheetModal } from '@suite-native/atoms';
import { useConfirmOnTrezorController } from '@suite-native/confirm-on-trezor';
import { useTranslate } from '@suite-native/intl';
import {
    AuthorizeDeviceStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
    StellarManageTokenStackParamList,
    StellarManageTokenStackRoutes,
} from '@suite-native/navigation';
import {
    NativeSendRootState,
    selectFeeLevels,
    useFeesManagement,
} from '@suite-native/transaction-management';
import { BASE_INFO } from '@trezor/blockchain-link-stellar/src/utils';
import { BigNumber } from '@trezor/utils';

import { getStellarTokenFormDraftKey, updateStellarTokenSelectedFeeLevelThunk } from '../thunks';
import { useStellarTokenInfo } from './useStellarTokenInfo';

export type StellarFeeScreenMode = 'activation' | 'deactivation';

// Navigation type that allows navigating between different stacks
type StellarFeeNavigationProps = StackToStackCompositeNavigationProps<
    StellarManageTokenStackParamList,
    StellarManageTokenStackRoutes.ActivationFee | StellarManageTokenStackRoutes.DeactivationFee,
    RootStackParamList
>;

type UseStellarFeeScreenParams = {
    accountKey: AccountKey;
    tokenContract: TokenAddress;
    mode: StellarFeeScreenMode;
    thunkAction: (params: {
        account: NonNullable<ReturnType<typeof selectAccountByKey>>;
        contractAddress: string;
        selectedFee: string;
        customFeePerUnit?: string;
    }) => any;
    onSuccess: () => void;
};

export const useStellarFeeScreen = ({
    accountKey,
    tokenContract,
    mode,
    thunkAction,
    onSuccess,
}: UseStellarFeeScreenParams) => {
    const dispatch = useDispatch();
    const navigation = useNavigation<StellarFeeNavigationProps>();
    const { showAlert } = useAlert();
    const { translate } = useTranslate();

    // Confirm on Trezor controller
    const { revealConfirmOnTrezorSheet, confirmOnTrezorRef, closeSheet } =
        useConfirmOnTrezorController();

    const {
        bottomSheetRef: tokenDetailRef,
        openModal: openTokenDetail,
        closeModal: closeTokenDetail,
    } = useBottomSheetModal();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    // Device button request for confirm on Trezor
    const buttonRequestCodes = useSelector((state: DeviceRootState) =>
        selectDeviceButtonRequestsCodes(state),
    );
    const hasButtonRequest = buttonRequestCodes.length > 0;

    // Check if device is connected and authorized
    const isDeviceConnectedAndAuthorized = useSelector((state: DeviceRootState) =>
        selectIsDeviceConnectedAndAuthorized(state),
    );

    // Ref to track if we have a pending sign operation after device connection
    const pendingSignRef = useRef(false);

    // Generate form draft key for this token operation
    const formDraftKey = getStellarTokenFormDraftKey(accountKey, tokenContract);

    // Get form draft from Redux
    const formDraft = useSelector((state: FormDraftRootState) =>
        selectDeepCopyOfFormDraft(state, formDraftKey),
    ) as FormState | undefined;

    // Get precomposed fee levels from Redux to extract the default fee per unit
    const precomposedFeeLevels = useSelector((state: NativeSendRootState) =>
        selectFeeLevels(state),
    );
    const normalFeePerUnit = isFinalPrecomposedTransaction(precomposedFeeLevels.normal)
        ? (precomposedFeeLevels.normal as PrecomposedTransactionFinal).feePerByte
        : undefined;

    const {
        form,
        selectedFeeLevel,
        fee,
        isSubmittable,
        areFeesLoading,
        feeLevels,
        handleFeeLevelChange,
        handleCustomFeeSet,
    } = useFeesManagement({
        accountKey,
        selectedFee: (formDraft?.selectedFee as FeeLevelLabel) ?? 'normal',
        selectedFeePerUnit: formDraft?.feePerUnit ?? normalFeePerUnit,
        updateThunk: updateStellarTokenSelectedFeeLevelThunk,
        formDraftKey,
    });

    const { tokenInfo } = useStellarTokenInfo(tokenContract);

    const [isSubmitting, setIsSubmitting] = useState(false);
    // Track if we're waiting for device confirmation
    const [isWaitingForDevice, setIsWaitingForDevice] = useState(false);

    // Check if balance is sufficient for activation (need fee + BASE_RESERVE for new trustline)
    const insufficientBalanceInfo = (() => {
        if (mode !== 'activation' || !account || !fee) {
            return null;
        }
        const availableBalance = BigNumber(account.availableBalance);
        const requiredAmount = BigNumber(fee).plus(BASE_INFO.BASE_RESERVE);

        if (availableBalance.lt(requiredAmount)) {
            return {
                required: requiredAmount.toString(),
                available: availableBalance.toString(),
            };
        }

        return null;
    })();

    const assetCode = tokenInfo?.symbol ?? '';
    const tokenName = tokenInfo?.name ?? assetCode;
    const issuerDomain =
        tokenInfo?.homeDomain ?? translate('moduleStellarToken.tokenDetail.unknownIssuer');
    const issuerAddress = tokenInfo?.contract.split('-')[1] ?? '';

    const isKnownToken = !!(tokenInfo?.name || tokenInfo?.homeDomain);
    const iconContractAddress = isKnownToken ? tokenContract : undefined;

    // Show/hide confirm on Trezor sheet based on device button request
    useEffect(() => {
        if (hasButtonRequest && isWaitingForDevice) {
            revealConfirmOnTrezorSheet();
        } else if (!hasButtonRequest && isWaitingForDevice) {
            // Device confirmation is done, close the sheet immediately
            closeSheet();
        }
    }, [hasButtonRequest, isWaitingForDevice, revealConfirmOnTrezorSheet, closeSheet]);

    const handleCancel = useCallback(() => {
        pendingSignRef.current = false;
        setIsSubmitting(false);
        closeSheet();
        navigation.goBack();
    }, [closeSheet, navigation]);

    const errorTitleKey =
        mode === 'activation'
            ? 'moduleStellarToken.networkFee.activationFailed'
            : 'moduleStellarToken.deactivationFee.deactivationFailed';

    const errorDescriptionKey =
        mode === 'activation'
            ? 'moduleStellarToken.networkFee.activationFailedDescription'
            : 'moduleStellarToken.deactivationFee.deactivationFailedDescription';

    const cancelNavigationScreen =
        mode === 'activation'
            ? StellarManageTokenStackRoutes.ActivationFee
            : StellarManageTokenStackRoutes.DeactivationFee;

    const executeSign = useCallback(async () => {
        if (!account || !fee) return;

        setIsWaitingForDevice(true);

        try {
            // Get custom fee per unit from form when using custom fee
            const customFeePerUnit =
                selectedFeeLevel === 'custom' ? form.getValues('customFeePerUnit') : undefined;

            const result = await dispatch(
                thunkAction({
                    account,
                    contractAddress: tokenContract,
                    selectedFee: selectedFeeLevel,
                    customFeePerUnit,
                }),
            );

            setIsWaitingForDevice(false);

            if (isFulfilled(result)) {
                // Refresh account data
                dispatch(fetchAndUpdateAccountThunk({ accountKey }));

                // Execute success callback
                onSuccess();
            } else {
                const errorMessage =
                    (result.payload as { message?: string })?.message ||
                    translate(errorDescriptionKey);
                showAlert({
                    title: translate(errorTitleKey),
                    description: errorMessage,
                    primaryButtonTitle: 'OK',
                });
            }
        } catch {
            setIsWaitingForDevice(false);
            showAlert({
                title: translate(errorTitleKey),
                description: translate('moduleStellarToken.networkFee.unexpectedError'),
                primaryButtonTitle: 'OK',
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [
        account,
        accountKey,
        dispatch,
        errorDescriptionKey,
        errorTitleKey,
        fee,
        form,
        onSuccess,
        selectedFeeLevel,
        showAlert,
        thunkAction,
        tokenContract,
        translate,
    ]);

    // When screen regains focus after device connection, execute pending sign
    useFocusEffect(
        useCallback(() => {
            if (pendingSignRef.current && isDeviceConnectedAndAuthorized) {
                // Immediately set to false to prevent re-entry (same pattern as TradingExchangePreviewScreen)
                pendingSignRef.current = false;
                executeSign();
            }
        }, [isDeviceConnectedAndAuthorized, executeSign]),
    );

    const handleReviewAndSign = useCallback(() => {
        if (!account) return;

        setIsSubmitting(true);
        pendingSignRef.current = true;

        // Navigate to device connection guard - it will show connect screen if needed,
        // or go back immediately if device is already connected
        navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
            screen: AuthorizeDeviceStackRoutes.DeviceConnectionGuard,
            params: {
                onCancelNavigationTarget: {
                    name: RootStackRoutes.StellarManageTokenStack,
                    params: {
                        screen: cancelNavigationScreen,
                        params: { accountKey, tokenContract },
                    },
                },
            },
        });
    }, [account, accountKey, cancelNavigationScreen, navigation, tokenContract]);

    return {
        // State
        account,
        isSubmitting,
        isSubmittable,
        insufficientBalanceInfo,
        areFeesLoading,
        // Form and fee management
        form,
        fee,
        feeLevels,
        selectedFeeLevel,
        formDraft,
        // Fee selection handlers
        handleFeeLevelChange,
        handleCustomFeeSet,
        // Token info
        assetCode,
        tokenName,
        issuerDomain,
        issuerAddress,
        iconContractAddress,
        // Bottom sheet refs and controls
        tokenDetailRef,
        openTokenDetail,
        closeTokenDetail,
        confirmOnTrezorRef,
        // Handlers
        handleCancel,
        handleReviewAndSign,
    };
};
