import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { BottomSheet, HStack, InlineAlertBox, Text, VStack } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { FormSubmitButton, useFormContext } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';

import { CustomFeeInputs } from './CustomFeeInputs';
import { FeesFormValues } from '../../../feesFormSchema';

type CustomFeeBottomSheetProps = {
    isVisible: boolean;
    onClose: () => void;
    accountKey: AccountKey;
    feeValue: string;
    isFeeLoading: boolean;
    isSubmittable: boolean;
    isErrorBoxVisible: boolean;
    onCustomFeeSet: (feePerUnit: string, feeLimit?: string) => void;
};

export const CustomFeeBottomSheet = ({
    isVisible,
    onClose,
    accountKey,
    feeValue,
    isFeeLoading,
    isSubmittable,
    isErrorBoxVisible,
    onCustomFeeSet,
}: CustomFeeBottomSheetProps) => {
    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    const { setValue, handleSubmit, getValues } = useFormContext<FeesFormValues>();

    const handleSetCustomFee = handleSubmit(() => {
        setValue('feeLevel', 'custom');
        const feePerUnit = getValues('customFeePerUnit');
        const feeLimit = getValues('customFeeLimit');
        onCustomFeeSet(feePerUnit, feeLimit);
        onClose();
    });

    if (!symbol) return null;

    return (
        <BottomSheet
            isVisible={isVisible}
            onClose={onClose}
            title={<Translation id="transactionManagement.fees.custom.bottomSheet.title" />}
            testID="@transactionManagement/custom-fee-bottom-sheet"
        >
            <VStack spacing="sp24" justifyContent="space-between" flex={1}>
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
                <FormSubmitButton
                    onPress={handleSetCustomFee}
                    isVisible={isSubmittable && isVisible}
                    testID="@transactionManagement/custom-fee-submit-button"
                >
                    <Translation id="transactionManagement.fees.custom.bottomSheet.confirmButton" />
                </FormSubmitButton>
            </VStack>
        </BottomSheet>
    );
};
