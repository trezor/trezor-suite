import React, { useState } from 'react';
import Animated, { FadeInLeft, FadeOutLeft } from 'react-native-reanimated';

import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import { AccountKey, FeeLevelLabel, FormState } from '@suite-common/wallet-types';
import { Box, Button, useBottomSheetModal } from '@suite-native/atoms';
import { useFormContext } from '@suite-native/forms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { CustomFeeBottomSheet } from './CustomFeeBottomSheet';
import { CustomFeeCard } from './CustomFeeCard';
import { FeesFormValues } from '../../../feesFormSchema';
import { CustomFeeParams } from '../../../hooks';
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
                colorScheme="tertiaryElevation0"
                size="small"
                viewLeft={<Icon name="plus" size="mediumLarge" />}
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

    const [previousSelectedFeeLevelLabel, setPreviousSelectedFeeLevelLabel] =
        useState<FeeLevelLabel>('normal');
    const { watch, setValue, getValues } = useFormContext<FeesFormValues>();

    const isCustomFeeSelected = watch('feeLevel') === 'custom';

    // Use the hook to get fee-related values
    const { feeValue, isFeeLoading, isSubmittable, isErrorBoxVisible } = useCustomFee({
        accountKey,
        formState: formDraft,
    });

    const openCustomFeeBottomSheet = () => {
        openModal();

        const currentSelectedFeeLevelLabel = getValues('feeLevel');
        if (currentSelectedFeeLevelLabel !== 'custom')
            setPreviousSelectedFeeLevelLabel(currentSelectedFeeLevelLabel);
    };

    const cancelCustomFee = () => {
        setValue('feeLevel', previousSelectedFeeLevelLabel);
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
