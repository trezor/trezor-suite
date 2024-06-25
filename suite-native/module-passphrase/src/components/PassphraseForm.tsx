import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';

import { useNavigation } from '@react-navigation/native';

import { Form, SecureTextInputField, useForm } from '@suite-native/forms';
import {
    passphraseFormSchema,
    PassphraseFormValues,
    formInputsMaxLength,
} from '@suite-common/validators';
import { Button, Card, VStack, TextDivider } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Translation } from '@suite-native/intl';
import {
    deviceActions,
    onPassphraseSubmit,
    selectDevice,
    selectHasDevicePassphraseEntryCapability,
} from '@suite-common/wallet-core';
import {
    PassphraseStackParamList,
    PassphraseStackRoutes,
    RootStackParamList,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

import { EnterPassphraseOnTrezorButton } from './EnterPassphraseOnTrezorButton';

const FORM_CARD_PADDING = 12;

type PassphraseFormProps = {
    onFocus?: () => void;
    inputLabel: string;
};

const formStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderRadius: utils.borders.radii.large,
    gap: utils.spacings.medium,
}));

const cardStyle = prepareNativeStyle(_ => ({
    padding: FORM_CARD_PADDING,
}));

type NavigationProp = StackToStackCompositeNavigationProps<
    PassphraseStackParamList,
    PassphraseStackRoutes.PassphraseForm,
    RootStackParamList
>;

export const PassphraseForm = ({ inputLabel, onFocus }: PassphraseFormProps) => {
    const dispatch = useDispatch();

    const [isInputFocused, setIsInputFocused] = useState(false);

    const { applyStyle } = useNativeStyles();

    const device = useSelector(selectDevice);
    const hasDevicePassphraseEntryCapability = useSelector(
        selectHasDevicePassphraseEntryCapability,
    );

    const navigation = useNavigation<NavigationProp>();

    const form = useForm<PassphraseFormValues>({
        validation: passphraseFormSchema,
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
        dispatch(deviceActions.removeButtonRequests({ device }));
        dispatch(onPassphraseSubmit({ value: passphrase, passphraseOnDevice: false }));
        navigation.push(PassphraseStackRoutes.PassphraseConfirmOnTrezor);
        // Reset values so when user comes back to this screen, it's clean (for example if try again is triggered later in the flow)
        reset();
    });

    const handleFocusInput = () => {
        setIsInputFocused(true);
        onFocus?.();
    };

    return (
        <Form form={form}>
            <Card style={applyStyle(cardStyle)}>
                <VStack style={applyStyle(formStyle)}>
                    <SecureTextInputField
                        label={inputLabel}
                        name="passphrase"
                        maxLength={formInputsMaxLength.passphrase}
                        accessibilityLabel="passphrase input"
                        autoCapitalize="none"
                        onFocus={handleFocusInput}
                        onBlur={() => setIsInputFocused(false)}
                        secureTextEntry
                    />
                    {isDirty && (
                        <Animated.View entering={FadeIn} exiting={FadeOut}>
                            <Button
                                accessibilityRole="button"
                                accessibilityLabel="confirm passphrase"
                                onPress={handleCreateHiddenWallet}
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
                            </VStack>
                        </Animated.View>
                    )}
                </VStack>
            </Card>
        </Form>
    );
};
