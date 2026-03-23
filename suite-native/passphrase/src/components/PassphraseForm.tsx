import { useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';

import {
    selectHasDevicePassphraseEntryCapability,
    selectSelectedDevice,
} from '@suite-common/device';
import {
    type PassphraseFormValues,
    formInputsMaxLength,
    passphraseFormSchema,
} from '@suite-common/validators';
import { submitPassphrase } from '@suite-common/wallet-core';
import { events } from '@suite-native/analytics';
import { Button, Card, TextDivider, VStack } from '@suite-native/atoms';
import { Form, SecureTextInputField, useForm } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { useAnalytics } from '@suite-native/services';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { EnterPassphraseOnTrezorButton } from './EnterPassphraseOnTrezorButton';
import { NoPassphraseButton } from './NoPassphraseButton';

const FORM_CARD_PADDING = 12;

type PassphraseFormProps = {
    onFocus?: () => void;
    inputLabel: string;
    noPassphraseEnabled?: boolean;
    onAfterSubmit?: () => void;
};

const cardStyle = prepareNativeStyle(_ => ({
    padding: FORM_CARD_PADDING,
}));

export const PassphraseForm = ({
    inputLabel,
    onFocus,
    noPassphraseEnabled,
    onAfterSubmit,
}: PassphraseFormProps) => {
    const analytics = useAnalytics();
    const dispatch = useDispatch();
    const formWrapperView = useRef<View>(null);

    const [isInputFocused, setIsInputFocused] = useState(false);

    const { applyStyle } = useNativeStyles();

    const device = useSelector(selectSelectedDevice);
    const hasDevicePassphraseEntryCapability = useSelector(
        selectHasDevicePassphraseEntryCapability,
    );

    const form = useForm<PassphraseFormValues>({
        validation: passphraseFormSchema,
        reValidateMode: 'onSubmit',
        defaultValues: {
            passphrase: '',
        },
    });

    const {
        handleSubmit,
        formState: { isDirty },
        reset,
    } = form;

    const handleCreateHiddenWallet = handleSubmit(({ passphrase }) => {
        if (!device) return;
        dispatch(submitPassphrase({ device, passphrase, passphraseOnDevice: false }));
        // Reset values so when user comes back to this screen,
        // it's clean (for example if try again is triggered later in the flow)
        reset();
        onAfterSubmit?.();
    });

    const handleFocusInput = () => {
        analytics.report({ type: events.passphraseEnterInAppEvent.name });
        setIsInputFocused(true);
        onFocus?.();
    };

    return (
        <Form form={form}>
            <View ref={formWrapperView}>
                <Card style={applyStyle(cardStyle)}>
                    <VStack spacing="sp16">
                        <SecureTextInputField
                            label={inputLabel}
                            name="passphrase"
                            maxLength={formInputsMaxLength.passphrase}
                            accessibilityLabel="passphrase input"
                            autoCapitalize="none"
                            onFocus={handleFocusInput}
                            onBlur={() => setIsInputFocused(false)}
                            secureTextEntry
                            testID="@passphrase/passphraseInput"
                        />
                        {isDirty && (
                            <Animated.View entering={FadeIn} exiting={FadeOut}>
                                <Button
                                    accessibilityRole="button"
                                    accessibilityLabel="confirm passphrase"
                                    onPress={handleCreateHiddenWallet}
                                    testID="@passphrase/confirmButton"
                                >
                                    <Translation id="modulePassphrase.form.enterWallet" />
                                </Button>
                            </Animated.View>
                        )}
                        {!isDirty && !isInputFocused && hasDevicePassphraseEntryCapability && (
                            <Animated.View entering={FadeIn} exiting={FadeOut}>
                                <VStack>
                                    <TextDivider
                                        title="generic.orSeparator"
                                        horizontalMargin={FORM_CARD_PADDING}
                                    />
                                    <EnterPassphraseOnTrezorButton />
                                    {noPassphraseEnabled && <NoPassphraseButton />}
                                </VStack>
                            </Animated.View>
                        )}
                    </VStack>
                </Card>
            </View>
        </Form>
    );
};
