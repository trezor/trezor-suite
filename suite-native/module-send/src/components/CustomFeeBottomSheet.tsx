import { useDispatch, useSelector } from 'react-redux';
import Animated, {
    FadeInDown,
    FadeOutDown,
    SlideInDown,
    SlideOutDown,
    useAnimatedStyle,
    withTiming,
} from 'react-native-reanimated';

import { useRoute } from '@react-navigation/native';

import { AlertBox, BottomSheet, Button, HStack, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useFormContext } from '@suite-native/forms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { SendStackParamList, SendStackRoutes, StackProps } from '@suite-native/navigation';

import { SendFeesFormValues } from '../sendFeesFormSchema';
import { CustomFeeInputs } from './CustomFeeInputs';
import { useCustomFee } from '../hooks/useCustomFee';
import { updateSelectedFeeLevelThunk } from '../sendFormThunks';

type CustomFeeBottomSheetProps = {
    isVisible: boolean;
    onClose: () => void;
};

type RouteProps = StackProps<SendStackParamList, SendStackRoutes.SendAddressReview>['route'];

export const CustomFeeBottomSheet = ({ isVisible, onClose }: CustomFeeBottomSheetProps) => {
    const route = useRoute<RouteProps>();
    const dispatch = useDispatch();
    const { accountKey, tokenContract } = route.params;

    const { feeValue, isFeeLoading, isSubmittable, isErrorBoxVisible } = useCustomFee({
        accountKey,
        tokenContract,
    });

    const networkSymbol = useSelector((state: AccountsRootState) =>
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

    const animatedButtonContainerStyle = useAnimatedStyle(
        () => ({
            height: withTiming(isSubmittable && isVisible ? 50 : 0),
        }),
        [isSubmittable, isVisible],
    );

    if (!networkSymbol) return null;

    return (
        <BottomSheet
            isVisible={isVisible}
            onClose={onClose}
            title={<Translation id="moduleSend.fees.custom.bottomSheet.title" />}
            testID="@send/custom-fee-bottom-sheet"
        >
            <VStack spacing="sp24" justifyContent="space-between" flex={1}>
                <CustomFeeInputs networkSymbol={networkSymbol} />
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
                            network={networkSymbol}
                        />
                        <CryptoAmountFormatter
                            value={feeValue}
                            network={networkSymbol}
                            variant="body"
                            isLoading={isFeeLoading}
                            isBalance={false}
                        />
                    </VStack>
                </HStack>
                {isErrorBoxVisible && (
                    <Animated.View entering={FadeInDown} exiting={FadeOutDown}>
                        <AlertBox
                            variant="error"
                            title={<Translation id="moduleSend.fees.error" />}
                            contentColor="textDefault"
                        />
                    </Animated.View>
                )}

                <Animated.View style={animatedButtonContainerStyle}>
                    {isSubmittable && (
                        <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
                            <Button
                                onPress={handleSetCustomFee}
                                testID="@send/custom-fee-submit-button"
                            >
                                <Translation id="moduleSend.fees.custom.bottomSheet.confirmButton" />
                            </Button>
                        </Animated.View>
                    )}
                </Animated.View>
            </VStack>
        </BottomSheet>
    );
};
