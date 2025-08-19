import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';

import { useRoute } from '@react-navigation/native';

import { AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import {
    BottomSheetModal,
    BottomSheetModalRef,
    HStack,
    InlineAlertBox,
    Text,
    VStack,
} from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { FormSubmitButton, useFormContext } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { SendStackParamList, SendStackRoutes, StackProps } from '@suite-native/navigation';

import { SendFeesFormValues } from '../sendFeesFormSchema';
import { CustomFeeInputs } from './CustomFeeInputs';
import { useCustomFee } from '../hooks/useCustomFee';
import { updateSelectedFeeLevelThunk } from '../sendFormThunks';

type CustomFeeBottomSheetProps = {
    ref: BottomSheetModalRef;
    onClose: () => void;
};
type RouteProps = StackProps<SendStackParamList, SendStackRoutes.SendAddressReview>['route'];

export const CustomFeeBottomSheet = ({ ref, onClose }: CustomFeeBottomSheetProps) => {
    const route = useRoute<RouteProps>();
    const dispatch = useDispatch();
    const { accountKey, tokenContract } = route.params;

    const { feeValue, isFeeLoading, isSubmittable, isErrorBoxVisible } = useCustomFee({
        accountKey,
        tokenContract,
    });

    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    const { setValue, handleSubmit, getValues } = useFormContext<SendFeesFormValues>();

    const handleSetCustomFee = handleSubmit(() => {
        setValue('feeLevel', 'custom');
        dispatch(
            updateSelectedFeeLevelThunk({
                accountKey,
                feeLevelLabel: 'custom',
                feePerUnit: getValues('customFeePerUnit'),
                feeLimit: getValues('customFeeLimit'),
            }),
        );
        onClose();
    });

    if (!symbol) return null;

    return (
        <BottomSheetModal
            ref={ref}
            title={<Translation id="moduleSend.fees.custom.bottomSheet.title" />}
            testID="@send/custom-fee-bottom-sheet"
            isCloseDisplayed
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
                        <Translation id="moduleSend.fees.custom.bottomSheet.total" />
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
                            title={<Translation id="moduleSend.fees.error" />}
                        />
                    </Animated.View>
                )}
                <FormSubmitButton
                    onPress={handleSetCustomFee}
                    testID="@send/custom-fee-submit-button"
                    isVisible={isSubmittable}
                >
                    <Translation id="moduleSend.fees.custom.bottomSheet.confirmButton" />
                </FormSubmitButton>
            </VStack>
        </BottomSheetModal>
    );
};
