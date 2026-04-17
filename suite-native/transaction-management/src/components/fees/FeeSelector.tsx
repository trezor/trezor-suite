import { useCallback, useRef } from 'react';
import { Keyboard } from 'react-native';
import { useDispatch } from 'react-redux';

import {
    type AccountKey,
    type FeeLevelLabel,
    type FormState,
    type TokenAddress,
} from '@suite-common/wallet-types';
import { useBottomSheetModal } from '@suite-native/atoms';

import { FeeSummaryCard } from './FeeSummaryCard';
import { FeesBottomSheet } from './FeesBottomSheet';
import { TronFeeSummaryCard } from './TronFeeSummaryCard';
import { type FeesFormValues } from '../../feesFormSchema';
import { type CustomFeeParams } from '../../hooks';
import { useFeesManagement } from '../../hooks/fees/useFeesManagement';
import { updateFeeLimitThunk } from '../../thunks';
import { type UpdateSelectedFeeLevelThunkParams } from '../../types';

type FeeSelectorProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
    updateThunk: (params: UpdateSelectedFeeLevelThunkParams) => void;
    selectedFee?: FeeLevelLabel;
    selectedFeePerUnit?: string;
    selectedSetMaxOutputId?: number;
    formDraft: FormState | null | undefined;
    formDraftKey?: string;
};

export const FeeSelector = ({
    accountKey,
    tokenContract,
    updateThunk,
    selectedFee,
    selectedFeePerUnit,
    selectedSetMaxOutputId,
    formDraft,
    formDraftKey,
}: FeeSelectorProps) => {
    const {
        form,
        fee,
        feeLevels,
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
    const snapshotRef = useRef<FeesFormValues>(undefined);
    const confirmedRef = useRef(false);

    const networkType = account?.networkType;
    const isTrc20 = networkType === 'tron' && !!tokenContract;

    const handleOpen = useCallback(() => {
        Keyboard.dismiss();
        confirmedRef.current = false;
        snapshotRef.current = form.getValues();
        // Reset to current values so isDirty starts as false for this open cycle
        form.reset(form.getValues());
        openModal();
    }, [form, openModal]);

    const handleConfirm = useCallback(
        (feeLevel: FeeLevelLabel, customParams?: CustomFeeParams) => {
            if (feeLevel === 'custom') {
                if (!customParams) return;
                if (isTrc20 && customParams.customFeeLimit) {
                    dispatch(
                        updateFeeLimitThunk({
                            accountKey,
                            tokenContract,
                            feeLimit: customParams.customFeeLimit,
                        }),
                    );
                } else {
                    handleCustomFeeSet(customParams);
                }
            } else {
                handleFeeLevelChange(feeLevel);
            }
        },
        [isTrc20, accountKey, tokenContract, dispatch, handleFeeLevelChange, handleCustomFeeSet],
    );

    const feeLimitSunOverride = isTrc20 ? form.watch('customFeeLimit') : undefined;

    if (!symbol || !networkType || (!fee && !areFeesLoading)) return null;

    return (
        <>
            {networkType === 'tron' ? (
                <TronFeeSummaryCard
                    accountKey={accountKey}
                    onPress={isTrc20 ? handleOpen : undefined}
                    testID="@transactionManagement/fee-selector-card"
                    feeLimitSunOverride={feeLimitSunOverride}
                    supportsAdjustableFees={isTrc20}
                />
            ) : (
                <FeeSummaryCard
                    fee={fee}
                    symbol={symbol}
                    networkType={networkType}
                    areFeesLoading={areFeesLoading}
                    onPress={handleOpen}
                    testID="@transactionManagement/fee-selector-card"
                />
            )}
            <FeesBottomSheet
                ref={bottomSheetRef}
                form={form}
                accountKey={accountKey}
                feeLevels={feeLevels}
                symbol={symbol}
                networkType={networkType}
                tokenContract={tokenContract}
                areFeesLoading={areFeesLoading}
                isSubmittable={isSubmittable}
                formDraft={formDraft}
                snapshotRef={snapshotRef}
                confirmedRef={confirmedRef}
                onConfirm={handleConfirm}
                closeModal={closeModal}
            />
        </>
    );
};
