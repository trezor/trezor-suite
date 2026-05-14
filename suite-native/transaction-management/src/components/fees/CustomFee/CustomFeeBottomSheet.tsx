import { type RefObject, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { BottomSheetModal, type BottomSheetModalRef, Box } from '@suite-native/atoms';
import { Form, FormSubmitButton, useFormContext } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';

import { CustomFeeContent } from './CustomFeeContent';
import { type FeesFormValues } from '../../../feesFormSchema';
import { type CustomFeeParams } from '../../../hooks';

type CustomFeeBottomSheetProps = {
    onClose: () => void;
    accountKey: AccountKey;
    feeValue: string;
    isFeeLoading: boolean;
    isSubmittable: boolean;
    isErrorBoxVisible: boolean;
    onCustomFeeSet: (customFeeParams: CustomFeeParams) => void;
    ref: BottomSheetModalRef;
    lastSavedValuesRef: RefObject<FeesFormValues | undefined>;
};

export const CustomFeeBottomSheet = ({
    onClose,
    accountKey,
    feeValue,
    isFeeLoading,
    isSubmittable,
    isErrorBoxVisible,
    ref,
    lastSavedValuesRef,
    onCustomFeeSet,
}: CustomFeeBottomSheetProps) => {
    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    const form = useFormContext<FeesFormValues>();
    const {
        setValue,
        handleSubmit,
        reset,
        formState: { isDirty },
        watch,
        getValues,
    } = form;

    const feeLevelValue = watch('feeLevel');

    const isButtonVisible = useMemo(
        () => (isDirty || feeLevelValue !== 'custom') && isSubmittable,
        [feeLevelValue, isDirty, isSubmittable],
    );

    const handleSetCustomFee = handleSubmit(data => {
        const { feeLevel, ...formData } = data;

        if (feeLevel !== 'custom') {
            setValue('feeLevel', 'custom');
        }

        const updatedData = { ...formData, feeLevel: 'custom' } satisfies FeesFormValues;
        lastSavedValuesRef.current = updatedData;

        // clear the dirty state
        reset(updatedData);

        onCustomFeeSet(formData);
        onClose();
    });

    const handleDismiss = useCallback(() => {
        reset({
            ...lastSavedValuesRef.current,
            feeLevel: getValues('feeLevel'),
        });
    }, [reset, lastSavedValuesRef, getValues]);

    if (!symbol) return null;

    return (
        <BottomSheetModal
            ref={ref}
            onClose={handleDismiss}
            title={<Translation id="transactionManagement.fees.custom.bottomSheet.title" />}
            testID="@transactionManagement/custom-fee-bottom-sheet"
            isCloseDisplayed
            bottomSheetCustomProps={{
                enableDynamicSizing: false,
                snapPoints: ['95%'],
            }}
        >
            <Form form={form}>
                <CustomFeeContent
                    symbol={symbol}
                    feeValue={feeValue}
                    isFeeLoading={isFeeLoading}
                    isErrorBoxVisible={isErrorBoxVisible}
                />
                <Box marginTop="sp16">
                    <FormSubmitButton
                        onPress={handleSetCustomFee}
                        isVisible={isButtonVisible}
                        testID="@transactionManagement/custom-fee-submit-button"
                    >
                        <Translation id="transactionManagement.fees.custom.bottomSheet.confirmButton" />
                    </FormSubmitButton>
                </Box>
            </Form>
        </BottomSheetModal>
    );
};
