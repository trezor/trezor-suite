import { useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import Animated, { LinearTransition, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { useRoute } from '@react-navigation/native';

import {
    AccountsRootState,
    selectAccountNetworkSymbol,
    selectIsTestnetAccount,
} from '@suite-common/wallet-core';
import { EventType, analytics } from '@suite-native/analytics';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { SendStackParamList, SendStackRoutes, StackProps } from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { AmountErrorMessage } from './AmountErrorMessage';
import { CryptoAmountInput } from './CryptoAmountInput';
import { FiatAmountInput } from './FiatAmountInput';
import { SendMaxButton } from './SendMaxButton';
import { SwitchAmountsButton } from './SwitchAmountsButton';

type AmountInputProps = {
    index: number;
};

type RouteProps = StackProps<SendStackParamList, SendStackRoutes.SendOutputs>['route'];

const ANIMATION_DURATION = 300;
const SCALE_FOCUSED = 1;
const SCALE_UNFOCUSED = 0.9;
const TRANSLATE_Y_FOCUSED = 0;
const TRANSLATE_Y_UNFOCUSED = 55;

const DEFAULT_INPUTS_WRAPPER_HEIGHT = 108;
const FIATLESS_INPUTS_WRAPPER_HEIGHT = 60;

const inputsWrapperStyle = prepareNativeStyle<{ isFiatDisplayed: boolean }>(
    (_, { isFiatDisplayed }) => ({
        height: isFiatDisplayed ? DEFAULT_INPUTS_WRAPPER_HEIGHT : FIATLESS_INPUTS_WRAPPER_HEIGHT,
        justifyContent: 'space-between',
    }),
);

const withPredefinedTiming = (toValue: number) =>
    withTiming(toValue, { duration: ANIMATION_DURATION });

export const AmountInputs = ({ index }: AmountInputProps) => {
    const route = useRoute<RouteProps>();
    const { accountKey, tokenContract } = route.params;
    const { applyStyle } = useNativeStyles();
    const isTestnet = useSelector((state: AccountsRootState) =>
        selectIsTestnetAccount(state, accountKey),
    );
    const isFiatDisplayed = !isTestnet;

    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    const [isCryptoSelected, setIsCryptoSelected] = useState(true);
    const amountInputsWrapperRef = useRef<View>(null);

    const cryptoRef = useRef<TextInput>(null);
    const cryptoScale = useSharedValue(SCALE_FOCUSED);
    const cryptoTranslateY = useSharedValue(TRANSLATE_Y_FOCUSED);

    const fiatScale = useSharedValue(SCALE_UNFOCUSED);
    const fiatTranslateY = useSharedValue(TRANSLATE_Y_UNFOCUSED);
    const fiatRef = useRef<TextInput>(null);

    const handleSwitchInputs = () => {
        if (isCryptoSelected) {
            cryptoScale.value = withPredefinedTiming(SCALE_UNFOCUSED);
            cryptoTranslateY.value = withPredefinedTiming(TRANSLATE_Y_UNFOCUSED);
            fiatScale.value = withPredefinedTiming(SCALE_FOCUSED);
            fiatTranslateY.value = withPredefinedTiming(TRANSLATE_Y_FOCUSED);

            setTimeout(() => fiatRef.current?.focus(), ANIMATION_DURATION);
        } else {
            cryptoScale.value = withPredefinedTiming(SCALE_FOCUSED);
            cryptoTranslateY.value = withPredefinedTiming(TRANSLATE_Y_FOCUSED);
            fiatScale.value = withPredefinedTiming(SCALE_UNFOCUSED);
            fiatTranslateY.value = withPredefinedTiming(TRANSLATE_Y_UNFOCUSED);

            setTimeout(() => cryptoRef.current?.focus(), ANIMATION_DURATION);
        }

        analytics.report({
            type: EventType.SendAmountInputSwitched,
            payload: { changedTo: isCryptoSelected ? 'fiat' : 'crypto' },
        });

        setIsCryptoSelected(!isCryptoSelected);
    };

    if (!symbol) return null;

    return (
        <View ref={amountInputsWrapperRef}>
            <VStack spacing="sp12">
                <HStack flex={1} justifyContent="space-between" alignItems="center">
                    <Animated.View layout={LinearTransition}>
                        <Text variant="hint">
                            <Translation id="moduleSend.outputs.recipients.amountLabel" />
                        </Text>
                    </Animated.View>
                    <SendMaxButton
                        outputIndex={index}
                        accountKey={accountKey}
                        tokenContract={tokenContract}
                    />
                </HStack>
                <Animated.View
                    layout={LinearTransition}
                    style={applyStyle(inputsWrapperStyle, { isFiatDisplayed })}
                >
                    <CryptoAmountInput
                        recipientIndex={index}
                        scaleValue={cryptoScale}
                        translateValue={cryptoTranslateY}
                        inputRef={cryptoRef}
                        accountKey={accountKey}
                        isDisabled={!isCryptoSelected}
                        symbol={symbol}
                        onPress={!isCryptoSelected ? handleSwitchInputs : undefined}
                        tokenContract={tokenContract}
                    />
                    {isFiatDisplayed && (
                        <>
                            <SwitchAmountsButton onPress={handleSwitchInputs} />
                            <FiatAmountInput
                                recipientIndex={index}
                                scaleValue={fiatScale}
                                translateValue={fiatTranslateY}
                                inputRef={fiatRef}
                                isDisabled={isCryptoSelected}
                                symbol={symbol}
                                tokenContract={tokenContract}
                                onPress={isCryptoSelected ? handleSwitchInputs : undefined}
                            />
                        </>
                    )}
                </Animated.View>
                <AmountErrorMessage outputIndex={index} isFiatDisplayed={isFiatDisplayed} />
            </VStack>
        </View>
    );
};
