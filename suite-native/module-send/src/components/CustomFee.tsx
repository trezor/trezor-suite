import React, { useState } from 'react';
import Animated, { FadeInLeft, FadeOutLeft } from 'react-native-reanimated';

import { Box, Button } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { useFormContext } from '@suite-native/forms';

import { CustomFeeBottomSheet } from './CustomFeeBottomSheet';
import { SendFeesFormValues } from '../sendFeesFormSchema';
import { CustomFeeCard } from './CustomFeeCard';
import { NativeSupportedFeeLevel } from '../types';

export const CustomFee = () => {
    const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
    const [previousSelectedFeeLevelLabel, setPreviousSelectedFeeLevelLabel] =
        useState<NativeSupportedFeeLevel>('normal');
    const { watch, setValue, getValues } = useFormContext<SendFeesFormValues>();

    const isCustomFeeSelected = watch('feeLevel') === 'custom';

    const openCustomFeeBottomSheet = () => {
        setIsBottomSheetVisible(true);

        const currentSelectedFeeLevelLabel = getValues('feeLevel');
        if (currentSelectedFeeLevelLabel !== 'custom')
            setPreviousSelectedFeeLevelLabel(currentSelectedFeeLevelLabel);
    };

    const closeCustomFeeBottomSheet = () => {
        setIsBottomSheetVisible(false);
    };

    const cancelCustomFee = () => {
        setValue('feeLevel', previousSelectedFeeLevelLabel);
        setIsBottomSheetVisible(false);
    };

    return (
        <Box flex={1}>
            {isCustomFeeSelected ? (
                <CustomFeeCard onEdit={openCustomFeeBottomSheet} onCancel={cancelCustomFee} />
            ) : (
                <Animated.View entering={FadeInLeft.delay(300)} exiting={FadeOutLeft}>
                    <Box alignSelf="center">
                        <Button
                            colorScheme="tertiaryElevation0"
                            size="small"
                            viewLeft={<Icon name="plus" size="mediumLarge" />}
                            onPress={openCustomFeeBottomSheet}
                        >
                            <Translation id="moduleSend.fees.custom.addButton" />
                        </Button>
                    </Box>
                </Animated.View>
            )}

            <CustomFeeBottomSheet
                isVisible={isBottomSheetVisible}
                onClose={closeCustomFeeBottomSheet}
            />
        </Box>
    );
};
