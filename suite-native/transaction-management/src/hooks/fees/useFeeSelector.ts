import { useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';

import {
    type AccountKey,
    type FeeLevelLabel,
    type FormState,
    type TokenAddress,
} from '@suite-common/wallet-types';
import { useBottomSheetModal } from '@suite-native/atoms';
import { useWatch } from '@suite-native/forms';

import { getFeeAvailability } from './feeAvailability';
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
        fee,
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

    const dispatch = useDispatch();
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();
    const snapshotRef = useRef<FeesFormValues | undefined>(undefined);
    const confirmedRef = useRef(false);

    const networkType = account?.networkType;
    const isTrc20 = networkType === 'tron' && !!tokenContract;
    const { isFeeUnavailable, feeError } = getFeeAvailability({
        fee,
        feeLevels,
        selectedFee: selectedFeeLevel,
        isLoading: areFeesLoading,
    });
    const feeUnavailableErrorTitle = usePrecomposedTransactionError({
        error: feeError,
        networkSymbol: symbol,
    });
    const shouldShowFeeUnavailableAlert =
        formDraft != null && isFeeUnavailable && !!feeUnavailableErrorTitle;

    const handleOpen = useCallback(() => {
        confirmedRef.current = false;
        snapshotRef.current = form.getValues();
        // Reset to current values so isDirty starts as false for this open cycle
        form.reset(form.getValues());
        openModal();
    }, [form, openModal]);

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
    const feeLimitSunOverride = isTrc20 ? customFeeLimit : undefined;

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
