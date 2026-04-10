import React, { useEffect, useRef } from 'react';
import Animated, { FadeInLeft, FadeOutLeft } from 'react-native-reanimated';

import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import { type AccountKey, type FormState } from '@suite-common/wallet-types';
import { Box, Button, useBottomSheetModal } from '@suite-native/atoms';
import { useFormContext } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';

import { CustomFeeBottomSheet } from './CustomFeeBottomSheet';
import { CustomFeeCard } from './CustomFeeCard';
import { type FeesFormValues } from '../../../feesFormSchema';
import { type CustomFeeParams } from '../../../hooks';
import { useCustomFee } from '../../../hooks/fees/useCustomFee';

type CustomFeeProps = {
    accountKey: AccountKey;
    symbol: NetworkSymbol;
    formDraft: FormState | null | undefined;
    onCustomFeeSet: (customFeeParams: CustomFeeParams) => void;
};

type CustomFeeButtonProps = {
    onPress: () => void;
};

export const CustomFeeButton = ({ onPress }: CustomFeeButtonProps) => (
    <Animated.View entering={FadeInLeft.delay(300)} exiting={FadeOutLeft}>
        <Box alignSelf="center">
            <Button
                intent="neutral"
                priority="secondary"
                size="medium"
                iconLeft="plus"
                testID="@transactionManagement/fees-level-custom"
                onPress={onPress}
            >
                <Translation id="transactionManagement.fees.custom.addButton" />
            </Button>
        </Box>
    </Animated.View>
);

const CustomFeeContentWrapper = ({ accountKey, formDraft, onCustomFeeSet }: CustomFeeProps) => {
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    const {
        watch,
        getValues,
        reset,
        formState: { defaultValues },
    } = useFormContext<FeesFormValues>();

    const isCustomFeeSelected = watch('feeLevel') === 'custom';
    const lastSavedValuesRef = useRef<FeesFormValues>(undefined);
    const initialFormValuesRef = useRef<FeesFormValues>(undefined);

    useEffect(() => {
        initialFormValuesRef.current = getValues();
    }, [getValues]);

    // Use the hook to get fee-related values
    const { feeValue, isFeeLoading, isSubmittable, isErrorBoxVisible } = useCustomFee({
        accountKey,
        formState: formDraft,
    });

    const openCustomFeeBottomSheet = () => {
        openModal();
        lastSavedValuesRef.current = defaultValues as FeesFormValues;

        // Store the initial form values when opening the modal in case of cancellation
        const currentSelectedFeeLevelLabel = getValues('feeLevel');
        if (currentSelectedFeeLevelLabel !== 'custom' && initialFormValuesRef.current !== undefined)
            // This allows the "Cancel" button to return to the last known standard fee
            initialFormValuesRef.current = {
                ...initialFormValuesRef.current,
                feeLevel: currentSelectedFeeLevelLabel,
            };
    };

    const cancelCustomFee = () => {
        reset(initialFormValuesRef.current);
        closeModal();
    };

    return (
        <Box flex={1}>
            {isCustomFeeSelected ? (
                <CustomFeeCard
                    accountKey={accountKey}
                    onEdit={openCustomFeeBottomSheet}
                    onCancel={cancelCustomFee}
                />
            ) : (
                <CustomFeeButton onPress={openCustomFeeBottomSheet} />
            )}

            <CustomFeeBottomSheet
                lastSavedValuesRef={lastSavedValuesRef}
                ref={bottomSheetRef}
                accountKey={accountKey}
                onClose={closeModal}
                onCustomFeeSet={onCustomFeeSet}
                feeValue={feeValue}
                isFeeLoading={isFeeLoading}
                isSubmittable={isSubmittable}
                isErrorBoxVisible={isErrorBoxVisible}
            />
        </Box>
    );
};

export const CustomFee = ({ accountKey, symbol, formDraft, onCustomFeeSet }: CustomFeeProps) => {
    // custom fees are not allowed for solana
    // we return null here so we don't need to mount the hooks there
    if (getNetworkType(symbol) === 'solana') {
        return null;
    }

    return (
        <CustomFeeContentWrapper
            accountKey={accountKey}
            symbol={symbol}
            formDraft={formDraft}
            onCustomFeeSet={onCustomFeeSet}
        />
    );
};
