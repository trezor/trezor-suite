import { useRef, useState } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { type NetworkSymbol, getNetwork, getNetworkType } from '@suite-common/wallet-config';
import {
    AnimatedVStack,
    HStack,
    InlineAlertBox,
    type InputType,
    Switch,
    Text,
    VStack,
} from '@suite-native/atoms';
import { TextInputField, useFormContext } from '@suite-native/forms';
import { integerTransformer } from '@suite-native/helpers';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import { useDebounce } from '@trezor/react-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { HELP_CENTER_OTHER_CRYPTOCURRENCIES_DESTINATION_TAGS_URL } from '@trezor/urls';

import { type SendFieldName, type SendOutputsFormValues } from '../sendOutputsFormSchema';

const titleTextStyle = prepareNativeStyle(utils => ({
    flex: 1,
    gap: utils.spacings.sp12,
}));

const inputWrapperStyle = prepareNativeStyle(utils => ({
    justifyContent: 'space-between',
    flexDirection: 'column',
    gap: utils.spacings.sp12,
}));

interface DestinationTagInputProps {
    networkSymbol: NetworkSymbol;
}

export const DestinationTagInput = ({ networkSymbol }: DestinationTagInputProps) => {
    const inputRef = useRef<InputType | null>(null);
    const { applyStyle } = useNativeStyles();

    const [isInputDisplayed, setIsInputDisplayed] = useState(true);
    const destinationTagFieldName: SendFieldName = 'destinationTag';
    const isDestinationTagEnabledFieldName: SendFieldName = 'isDestinationTagEnabled';

    const debounce = useDebounce();

    const { trigger, setValue } = useFormContext<SendOutputsFormValues>();

    const handleShowInputChange = () => {
        if (!isInputDisplayed) {
            setValue(isDestinationTagEnabledFieldName, true);
            // Wait for input element to be mounted.
            setTimeout(() => {
                inputRef.current?.focus();
            });
        } else {
            setValue(isDestinationTagEnabledFieldName, false);
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
                    <Text variant="body-sm">
                        <Translation id="moduleSend.outputs.recipients.destinationTag.label" />
                    </Text>
                    <Text variant="body-sm">
                        <Translation
                            id="moduleSend.outputs.recipients.destinationTag.linkText"
                            values={{
                                link: chunk => (
                                    <Link
                                        label={chunk}
                                        textVariant="body-sm"
                                        href={
                                            HELP_CENTER_OTHER_CRYPTOCURRENCIES_DESTINATION_TAGS_URL
                                        }
                                        isUnderlined
                                        textColor="contentPrimary"
                                        textPressedColor="contentSecondary"
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
                        valueTransformer={
                            getNetworkType(networkSymbol) === 'ripple'
                                ? integerTransformer
                                : undefined
                        }
                        ref={inputRef}
                        onChangeText={handleChangeValue}
                        name={destinationTagFieldName}
                        testID={destinationTagFieldName}
                        accessibilityLabel="address input"
                    />
                    <HStack paddingHorizontal="sp12" spacing="sp4">
                        <Icon name="info" color="contentSecondary" size="medium" />
                        <Text variant="body-xs" color="contentSecondary">
                            <Translation id="moduleSend.outputs.recipients.destinationTag.info" />
                        </Text>
                    </HStack>
                </AnimatedVStack>
            ) : (
                <Animated.View entering={FadeIn} exiting={FadeOut}>
                    <InlineAlertBox
                        variant="warning"
                        title={
                            <Translation
                                id="moduleSend.outputs.recipients.destinationTag.warning"
                                values={{ network: getNetwork(networkSymbol).name }}
                            />
                        }
                    />
                </Animated.View>
            )}
        </VStack>
    );
};
