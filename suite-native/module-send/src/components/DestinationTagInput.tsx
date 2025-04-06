import { useRef, useState } from 'react';
import { TextInput } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { AnimatedVStack, HStack, InlineAlertBox, Switch, Text, VStack } from '@suite-native/atoms';
import { TextInputField, useFormContext } from '@suite-native/forms';
import { integerTransformer } from '@suite-native/helpers';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import { useDebounce } from '@trezor/react-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { SendFieldName, SendOutputsFormValues } from '../sendOutputsFormSchema';

const titleTextStyle = prepareNativeStyle(utils => ({
    flex: 1,
    gap: utils.spacings.sp12,
}));

const inputWrapperStyle = prepareNativeStyle(utils => ({
    justifyContent: 'space-between',
    flexDirection: 'column',
    gap: utils.spacings.sp12,
}));

export const DestinationTagInput = () => {
    const inputRef = useRef<TextInput | null>(null);
    const { applyStyle } = useNativeStyles();

    const [isInputDisplayed, setIsInputDisplayed] = useState(true);
    const destinationTagFieldName: SendFieldName = 'rippleDestinationTag';
    const isRippleDestinationTagEnabledFieldName: SendFieldName = 'isRippleDestinationTagEnabled';

    const debounce = useDebounce();

    const { trigger, setValue } = useFormContext<SendOutputsFormValues>();

    const handleShowInputChange = () => {
        if (!isInputDisplayed) {
            setValue(isRippleDestinationTagEnabledFieldName, true);
            // Wait for input element to be mounted.
            setTimeout(() => {
                inputRef.current?.focus();
            });
        } else {
            setValue(isRippleDestinationTagEnabledFieldName, false);
        }
        trigger(destinationTagFieldName);
        setIsInputDisplayed(!isInputDisplayed);
    };

    const handleChangeValue = () => {
        debounce(() => {
            trigger(destinationTagFieldName);
        });
    };

    return (
        <VStack style={applyStyle(inputWrapperStyle)}>
            <HStack alignContent="space-between" alignItems="center">
                <HStack style={applyStyle(titleTextStyle)}>
                    <Text variant="hint">
                        <Translation id="moduleSend.outputs.recipients.destinationTag.label" />
                    </Text>
                    <Text variant="hint">
                        <Translation
                            id="moduleSend.outputs.recipients.destinationTag.linkText"
                            values={{
                                link: chunk => (
                                    <Link
                                        label={chunk}
                                        textVariant="hint"
                                        href="https://trezor.io/learn/a/destination-tags"
                                        isUnderlined
                                        textColor="textDefault"
                                        textPressedColor="textSubdued"
                                    />
                                ),
                            }}
                        />
                    </Text>
                </HStack>
                <Switch isChecked={isInputDisplayed} onChange={handleShowInputChange} />
            </HStack>
            {isInputDisplayed ? (
                <AnimatedVStack spacing="sp8" entering={FadeIn} exiting={FadeOut}>
                    <TextInputField
                        valueTransformer={integerTransformer}
                        ref={inputRef}
                        onChangeText={handleChangeValue}
                        name={destinationTagFieldName}
                        testID={destinationTagFieldName}
                        accessibilityLabel="address input"
                    />
                    <HStack paddingHorizontal="sp12" spacing="sp4">
                        <Icon name="info" color="iconSubdued" size="medium" />
                        <Text variant="label" color="textSubdued">
                            <Translation id="moduleSend.outputs.recipients.destinationTag.info" />
                        </Text>
                    </HStack>
                </AnimatedVStack>
            ) : (
                <Animated.View entering={FadeIn} exiting={FadeOut}>
                    <InlineAlertBox
                        variant="warning"
                        title={
                            <Translation id="moduleSend.outputs.recipients.destinationTag.warning" />
                        }
                    />
                </Animated.View>
            )}
        </VStack>
    );
};
