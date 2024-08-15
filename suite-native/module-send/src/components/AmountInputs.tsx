import { useSharedValue, withTiming } from 'react-native-reanimated';
import { useRef, useState } from 'react';
import { TextInput } from 'react-native';
import { useSelector } from 'react-redux';

import { VStack, HStack, Box, Text } from '@suite-native/atoms';
import { AccountKey } from '@suite-common/wallet-types';
import {
    AccountsRootState,
    selectAccountNetworkSymbol,
    selectIsTestnetAccount,
} from '@suite-common/wallet-core';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { CryptoAmountInput } from './CryptoAmountInput';
import { FiatAmountInput } from './FiatAmountInput';
import { AmountErrorMessage } from './AmountErrorMessage';
import { SwitchAmountsButton } from './SwitchAmountsButton';

type AmountInputProps = {
    index: number;
    accountKey: AccountKey;
};

const ANIMATION_DURATION = 300;
const SCALE_FOCUSED = 1;
const SCALE_UNFOCUSED = 0.9;
const TRANSLATE_Y_FOCUSED = 0;
const TRANSLATE_Y_UNFOCUSED = 55;

const DEFAULT_INPUTS_WRAPPER_HEIGHT = 116;
const FIATLESS_INPUTS_WRAPPER_HEIGHT = 80;

const inputsWrapperStyle = prepareNativeStyle<{ isFiatDisplayed: boolean }>(
    (_, { isFiatDisplayed }) => ({
        height: isFiatDisplayed ? DEFAULT_INPUTS_WRAPPER_HEIGHT : FIATLESS_INPUTS_WRAPPER_HEIGHT,
        justifyContent: 'space-between',
    }),
);

const withPredefinedTiming = (toValue: number) =>
    withTiming(toValue, { duration: ANIMATION_DURATION });

export const AmountInputs = ({ index, accountKey }: AmountInputProps) => {
    const { applyStyle } = useNativeStyles();
    const isTestnet = useSelector((state: AccountsRootState) =>
        selectIsTestnetAccount(state, accountKey),
    );
    const isFiatDisplayed = !isTestnet;

    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    const [isCryptoSelected, setIsCryptoSelected] = useState(true);

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

        setIsCryptoSelected(!isCryptoSelected);
    };

    if (!networkSymbol) return null;

    return (
        <VStack spacing={12}>
            <HStack flex={1} justifyContent="space-between" alignItems="center">
                <Text variant="hint">
                    <Translation id="moduleSend.outputs.recipients.amountLabel" />
                </Text>
                {/* TODO: SEND MAX button */}
                {/* <Button size="small" colorScheme="tertiaryElevation0">
                    Send max
                </Button> */}
            </HStack>
            <Box style={applyStyle(inputsWrapperStyle, { isFiatDisplayed })}>
                <CryptoAmountInput
                    recipientIndex={index}
                    scaleValue={cryptoScale}
                    translateValue={cryptoTranslateY}
                    inputRef={cryptoRef}
                    isDisabled={!isCryptoSelected}
                    networkSymbol={networkSymbol}
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
                            networkSymbol={networkSymbol}
                        />
                    </>
                )}
                <AmountErrorMessage outputIndex={index} isFiatDisplayed={isFiatDisplayed} />
            </Box>
        </VStack>
    );
};
