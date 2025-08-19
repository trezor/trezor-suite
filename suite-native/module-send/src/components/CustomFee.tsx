import React, { useState } from 'react';
import Animated, { FadeInLeft, FadeOutLeft } from 'react-native-reanimated';

import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import { Box, Button, useBottomSheetModal } from '@suite-native/atoms';
import { useFormContext } from '@suite-native/forms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { CustomFeeBottomSheet } from './CustomFeeBottomSheet';
import { SendFeesFormValues } from '../sendFeesFormSchema';
import { CustomFeeCard } from './CustomFeeCard';
import { NativeSupportedFeeLevel } from '../types';

type CustomFeeProps = {
    symbol: NetworkSymbol;
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
                testID="@send/fees-level-custom"
                onPress={onPress}
            >
                <Translation id="moduleSend.fees.custom.addButton" />
            </Button>
        </Box>
    </Animated.View>
);

export const CustomFee = ({ symbol }: CustomFeeProps) => {
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    const [previousSelectedFeeLevelLabel, setPreviousSelectedFeeLevelLabel] =
        useState<NativeSupportedFeeLevel>('normal');
    const { watch, setValue, getValues } = useFormContext<SendFeesFormValues>();

    const isCustomFeeSelected = watch('feeLevel') === 'custom';

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

    // custom fees are not allowed for solana
    if (getNetworkType(symbol) === 'solana') {
        return null;
    }

    return (
        <Box flex={1}>
            {isCustomFeeSelected ? (
                <CustomFeeCard onEdit={openCustomFeeBottomSheet} onCancel={cancelCustomFee} />
            ) : (
                <CustomFeeButton onPress={openCustomFeeBottomSheet} />
            )}

            <CustomFeeBottomSheet ref={bottomSheetRef} onClose={closeModal} />
        </Box>
    );
};
