import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import {
    BottomSheetModal,
    BottomSheetModalRef,
    Box,
    HStack,
    InlineAlertBox,
    Text,
    VStack,
} from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { FormSubmitButton, useFormContext } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';

import { CustomFeeInputs } from './CustomFeeInputs';
import { FeesFormValues } from '../../../feesFormSchema';
import { CustomFeeParams } from '../../../hooks';
import {
    FEE_LIMIT_FIELD_NAME,
    FEE_PER_UNIT_FIELD_NAME,
    MAX_FEE_PER_GAS_FIELD_NAME,
    MAX_PRIORITY_FEE_PER_GAS_FIELD_NAME,
} from '../../../presets';
type CustomFeeBottomSheetProps = {
    onClose: () => void;
    accountKey: AccountKey;
    feeValue: string;
    isFeeLoading: boolean;
    isSubmittable: boolean;
    isErrorBoxVisible: boolean;
    onCustomFeeSet: (customFeeParams: CustomFeeParams) => void;
    ref: BottomSheetModalRef;
};

export const CustomFeeBottomSheet = ({
    onClose,
    accountKey,
    feeValue,
    isFeeLoading,
    isSubmittable,
    isErrorBoxVisible,
    ref,
    onCustomFeeSet,
}: CustomFeeBottomSheetProps) => {
    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    const { setValue, handleSubmit, getValues } = useFormContext<FeesFormValues>();

    const handleSetCustomFee = handleSubmit(() => {
        setValue('feeLevel', 'custom');
        const customFeePerUnit = getValues(FEE_PER_UNIT_FIELD_NAME);
        const customFeeLimit = getValues(FEE_LIMIT_FIELD_NAME);
        const customMaxFeePerGas = getValues(MAX_FEE_PER_GAS_FIELD_NAME);
        const customMaxPriorityFeePerGas = getValues(MAX_PRIORITY_FEE_PER_GAS_FIELD_NAME);
        onCustomFeeSet({
            customFeePerUnit,
            customFeeLimit,
            customMaxFeePerGas,
            customMaxPriorityFeePerGas,
        });
        onClose();
    });

    if (!symbol) return null;

    return (
        <BottomSheetModal
            ref={ref}
            title={<Translation id="transactionManagement.fees.custom.bottomSheet.title" />}
            testID="@transactionManagement/custom-fee-bottom-sheet"
            isCloseDisplayed
            bottomSheetCustomProps={{
                enableDynamicSizing: false,
                snapPoints: ['95%'],
            }}
        >
            <VStack marginTop="sp24" spacing="sp24" justifyContent="space-between" flex={1}>
                <CustomFeeInputs symbol={symbol} />
                <HStack
                    flex={1}
                    justifyContent="space-between"
                    alignItems="center"
                    paddingHorizontal="sp1"
                >
                    <Text variant="highlight">
                        <Translation id="transactionManagement.fees.custom.bottomSheet.total" />
                    </Text>
                    <VStack alignItems="flex-end">
                        <CryptoToFiatAmountFormatter
                            value={feeValue}
                            isLoading={isFeeLoading}
                            symbol={symbol}
                        />
                        <CryptoAmountFormatter
                            value={feeValue}
                            symbol={symbol}
                            variant="body"
                            isLoading={isFeeLoading}
                            isBalance={false}
                        />
                    </VStack>
                </HStack>
                {isErrorBoxVisible && (
                    <Animated.View entering={FadeInDown} exiting={FadeOutDown}>
                        <InlineAlertBox
                            variant="critical"
                            title={<Translation id="transactionManagement.fees.error" />}
                        />
                    </Animated.View>
                )}
            </VStack>
            <Box marginTop="sp16">
                <FormSubmitButton
                    onPress={handleSetCustomFee}
                    isVisible={isSubmittable}
                    testID="@transactionManagement/custom-fee-submit-button"
                >
                    <Translation id="transactionManagement.fees.custom.bottomSheet.confirmButton" />
                </FormSubmitButton>
            </Box>
        </BottomSheetModal>
    );
};
