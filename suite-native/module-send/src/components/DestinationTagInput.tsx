import Animated, {
    FadeIn,
    FadeOut,
    LinearTransition,
    useSharedValue,
} from 'react-native-reanimated';
import { useRef, useState } from 'react';
import { findNodeHandle, TextInput, View } from 'react-native';
import { useSelector } from 'react-redux';

import { useRoute } from '@react-navigation/native';

import { Text, IconButton, Box } from '@suite-native/atoms';
import { TextInputField, useFormContext } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { useDebounce } from '@trezor/react-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    SendStackParamList,
    SendStackRoutes,
    StackProps,
    useScrollView,
} from '@suite-native/navigation';

import { SendFieldName, SendOutputsFormValues } from '../sendOutputsFormSchema';
import { NativeSendRootState, selectRippleDestinationTagFromDraft } from '../sendFormSlice';
import { integerTransformer } from '../hooks/useSendAmountTransformers';

const inputWrapperStyle = prepareNativeStyle<{ isInputDisplayed: boolean }>(
    (utils, { isInputDisplayed }) => ({
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',

        extend: {
            condition: isInputDisplayed,
            style: {
                alignItems: undefined,
                flexDirection: 'column',
                gap: utils.spacings.sp12,
            },
        },
    }),
);

const SCROLL_TO_DELAY = 200;

type RouteProps = StackProps<SendStackParamList, SendStackRoutes.SendOutputs>['route'];

export const DestinationTagInput = () => {
    const route = useRoute<RouteProps>();
    const { accountKey, tokenContract } = route.params;
    const inputWrapperRef = useRef<View | null>(null);
    const inputRef = useRef<TextInput | null>(null);
    const inputHeight = useSharedValue<number | null>(null);
    const scrollView = useScrollView();
    const { applyStyle } = useNativeStyles();

    const isDestinationTagPresentInDraft = !!useSelector((state: NativeSendRootState) =>
        selectRippleDestinationTagFromDraft(state, accountKey, tokenContract),
    );

    const [isInputDisplayed, setIsInputDisplayed] = useState(isDestinationTagPresentInDraft);
    const destinationTagFieldName: SendFieldName = 'rippleDestinationTag';
    const debounce = useDebounce();

    const { trigger } = useFormContext<SendOutputsFormValues>();

    const handleShowInput = () => {
        setIsInputDisplayed(true);

        // Wait for input element to be mounted.
        setTimeout(() => {
            inputRef.current?.focus();
        });
    };

    const handleInputFocus = () => {
        const inputWrapper = inputWrapperRef.current;
        const scrollViewNodeHandle = findNodeHandle(scrollView);

        if (!inputWrapper || !scrollViewNodeHandle) return;

        // Timeout is needed so the position is calculated after keyboard and footer animations are finished.
        setTimeout(
            () =>
                // Scroll so the whole amount inputs section is visible.
                inputWrapper.measureLayout(scrollViewNodeHandle, (_x, y, _w, h) => {
                    inputHeight.value = h;
                    scrollView?.scrollTo({ y, animated: true });
                }),
            SCROLL_TO_DELAY,
        );
    };

    const handleChangeValue = () => {
        debounce(() => {
            trigger(destinationTagFieldName);
            handleInputFocus();
        });
    };

    return (
        <Animated.View layout={LinearTransition} ref={inputWrapperRef}>
            <Box style={applyStyle(inputWrapperStyle, { isInputDisplayed })}>
                <Animated.View layout={LinearTransition}>
                    <Text variant="hint">
                        <Translation id="moduleSend.outputs.recipients.destinationTagLabel" />
                    </Text>
                </Animated.View>
                {!isInputDisplayed && (
                    <Animated.View entering={FadeIn} exiting={FadeOut}>
                        <IconButton
                            iconName="plus"
                            colorScheme="tertiaryElevation1"
                            onPress={handleShowInput}
                        />
                    </Animated.View>
                )}
                {isInputDisplayed && (
                    <Animated.View entering={FadeIn} exiting={FadeOut}>
                        <TextInputField
                            valueTransformer={integerTransformer}
                            ref={inputRef}
                            onChangeText={handleChangeValue}
                            name={destinationTagFieldName}
                            testID={destinationTagFieldName}
                            onFocus={handleInputFocus}
                            accessibilityLabel="address input"
                        />
                    </Animated.View>
                )}
            </Box>
        </Animated.View>
    );
};
