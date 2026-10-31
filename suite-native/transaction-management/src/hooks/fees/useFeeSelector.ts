import { useCallback, useRef } from 'react';

import type {
    AccountKey,
    FeeLevelLabel,
    FormState,
    TokenAddress,
} from '@suite-common/wallet-types';
import { isFinalPrecomposedTransaction } from '@suite-common/wallet-types';
import { useBottomSheetModal } from '@suite-native/atoms';
import { useWatch } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { getFeeAvailability } from './feeAvailability';
import { getFeeSelectorFormValues } from './feeSelectorFormValues';
import { type CustomFeeParams } from './useFeeSelection';
import { useFeesManagement } from './useFeesManagement';
import { type FeesFormValues } from '../../feesFormSchema';
import { updateFeeLimitThunk } from '../../thunks';
import { type UpdateSelectedFeeLevelThunkParams } from '../../types';
import { usePrecomposedTransactionError } from '../usePrecomposedTransactionError';

export type UseFeeSelectorParams = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
    updateThunk: (params: UpdateSelectedFeeLevelThunkParams) => void;
    selectedFee?: FeeLevelLabel;
    selectedFeePerUnit?: string;
    selectedSetMaxOutputId?: number;
    formDraft: FormState | null | undefined;
    formDraftKey?: string;
    onFeeConfirmed?: () => void | Promise<void>;
};

export const useFeeSelector = ({
    accountKey,
    tokenContract,
    updateThunk,
    selectedFee,
    selectedFeePerUnit,
    selectedSetMaxOutputId,
    formDraft,
    formDraftKey,
    onFeeConfirmed,
}: UseFeeSelectorParams) => {
    const {
        form,
        feeLevels,
        selectedFeeLevel,
        areFeesLoading,
        isSubmittable,
        symbol,
        account,
        handleFeeLevelChange,
        handleCustomFeeSet,
    } = useFeesManagement({
        accountKey,
        tokenContract,
        updateThunk,
        selectedFee,
        selectedFeePerUnit,
        selectedSetMaxOutputId,
        formDraftKey,
    });

    const { dispatch } = useServices(injectDispatch);
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();
    const snapshotRef = useRef<FeesFormValues | undefined>(undefined);
    const confirmedRef = useRef(false);

    const { translate } = useTranslate();
    const networkType = account?.networkType;
    const isTrc20 = networkType === 'tron' && !!tokenContract;
    const confirmedFeeLevel = feeLevels[selectedFee ?? selectedFeeLevel];
    const fee = isFinalPrecomposedTransaction(confirmedFeeLevel) ? confirmedFeeLevel.fee : null;
    const { isFeeUnavailable, feeError } = getFeeAvailability({
        feeLevels,
        selectedFee: selectedFee ?? selectedFeeLevel,
        isLoading: areFeesLoading,
    });
    const precomposedErrorTitle = usePrecomposedTransactionError({
        error: feeError,
        networkSymbol: symbol,
    });
    const feeUnavailableErrorTitle =
        precomposedErrorTitle ??
        (isFeeUnavailable ? translate('moduleSend.fees.unavailable') : null);
    const shouldShowFeeUnavailableAlert = isFeeUnavailable;

    const handleOpen = useCallback(() => {
        confirmedRef.current = false;
        const savedValues = getFeeSelectorFormValues({
            networkType,
            symbol,
            selectedFee,
            formDraft,
            feeLevels,
            previousValues: form.getValues(),
        });
        snapshotRef.current = savedValues;
        form.reset(savedValues);
        openModal();
    }, [form, openModal, selectedFee, formDraft, feeLevels, networkType, symbol]);

    const handleConfirm = useCallback(
        async (feeLevel: FeeLevelLabel, customParams?: CustomFeeParams) => {
            if (feeLevel === 'custom') {
                if (!customParams) {
                    return;
                }

                if (isTrc20 && customParams.customFeeLimit) {
                    await dispatch(
                        updateFeeLimitThunk({
                            accountKey,
                            tokenContract,
                            feeLimit: customParams.customFeeLimit,
                        }),
                    );
                } else {
                    await handleCustomFeeSet(customParams);
                }
            } else {
                await handleFeeLevelChange(feeLevel);
            }

            await onFeeConfirmed?.();
        },
        [
            isTrc20,
            accountKey,
            tokenContract,
            dispatch,
            handleFeeLevelChange,
            handleCustomFeeSet,
            onFeeConfirmed,
        ],
    );

    const customFeeLimit = useWatch({ control: form.control, name: 'customFeeLimit' });
    const feeLimitSunOverride = isTrc20 ? customFeeLimit || undefined : undefined;

    return {
        form,
        fee,
        feeLevels,
        areFeesLoading,
        isSubmittable,
        symbol,
        networkType,
        isTrc20,
        feeLimitSunOverride,
        shouldShowFeeUnavailableAlert,
        feeUnavailableErrorTitle,
        bottomSheetRef,
        closeModal,
        snapshotRef,
        confirmedRef,
        handleOpen,
        handleConfirm,
    };
};
