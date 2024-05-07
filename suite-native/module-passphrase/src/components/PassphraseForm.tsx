import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';

import { useNavigation } from '@react-navigation/native';

import { Form, TextInputField, useForm } from '@suite-native/forms';
import {
    passphraseFormSchema,
    PassphraseFormValues,
    formInputsMaxLength,
} from '@suite-common/validators';
import { Button, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Translation } from '@suite-native/intl';
import {
    deviceActions,
    onPassphraseSubmit,
    selectDevice,
    selectDeviceButtonRequestsCodes,
    selectDeviceState,
    selectIsDeviceDiscoveryActive,
} from '@suite-common/wallet-core';
import {
    PassphraseStackParamList,
    PassphraseStackRoutes,
    RootStackParamList,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

type PassphraseFormProps = {
    onFocus?: () => void;
    inputLabel: string;
};

const formStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderRadius: utils.borders.radii.large,
}));

type NavigationProp = StackToStackCompositeNavigationProps<
    PassphraseStackParamList,
    PassphraseStackRoutes.PassphraseForm,
    RootStackParamList
>;

export const PassphraseForm = ({ inputLabel, onFocus }: PassphraseFormProps) => {
    const dispatch = useDispatch();

    const { applyStyle } = useNativeStyles();

    const device = useSelector(selectDevice);
    const buttonRequestCodes = useSelector(selectDeviceButtonRequestsCodes);
    const deviceState = useSelector(selectDeviceState);
    const isDiscoveryActive = useSelector(selectIsDeviceDiscoveryActive);

    const navigation = useNavigation<NavigationProp>();

    const form = useForm<PassphraseFormValues>({
        validation: passphraseFormSchema,
        defaultValues: {
            passphrase: '',
        },
    });

    const { handleSubmit, watch } = form;

    useEffect(() => {
        if (buttonRequestCodes.includes('ButtonRequest_Other')) {
            navigation.navigate(PassphraseStackRoutes.PassphraseConfirmOnTrezor);
            dispatch(deviceActions.removeButtonRequests({ device }));
        }
    }, [buttonRequestCodes, device, deviceState, dispatch, isDiscoveryActive, navigation]);

    const handleCreateHiddenWallet = handleSubmit(({ passphrase }) => {
        dispatch(deviceActions.removeButtonRequests({ device }));
        dispatch(onPassphraseSubmit({ value: passphrase, passphraseOnDevice: false }));
    });

    const inputHasValue = !!watch('passphrase').length;

    return (
        <Form form={form}>
            <VStack spacing="medium" padding="medium" style={applyStyle(formStyle)}>
                <TextInputField
                    label={inputLabel}
                    name="passphrase"
                    maxLength={formInputsMaxLength.passphrase}
                    accessibilityLabel="passphrase input"
                    autoCapitalize="none"
                    onFocus={onFocus}
                    secureTextEntry
                />
                {inputHasValue && (
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
            </VStack>
        </Form>
    );
};
