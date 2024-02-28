import { useEffect, useRef, useState } from 'react';
import { Modal, TextInput } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { useSetAtom } from 'jotai';

import { Form, TextInputField, useForm } from '@suite-native/forms';
import {
    passphraseFormSchema,
    PassphraseFormValues,
    formInputsMaxLength,
} from '@suite-common/validators';
import { Box, Button, Text, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { useTranslate } from '@suite-native/intl';
import {
    createDeviceInstance,
    selectDevice,
    selectDeviceButtonRequestsCodes,
} from '@suite-common/wallet-core';
import TrezorConnect, { UI } from '@trezor/connect';

import { isPassphraseModalVisibleAtom } from './isPassphraseModalVisibleAtom';

const modalBackgroundOverlayStyle = prepareNativeStyle(utils => ({
    flex: 1,
    justifyContent: 'center',
    backgroundColor: utils.transparentize(0.3, utils.colors.backgroundNeutralBold),
}));

const formStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderRadius: utils.borders.radii.large,
    margin: utils.spacings.medium,
}));

export const PassphraseFormModal = () => {
    const { translate } = useTranslate();
    const dispatch = useDispatch();
    const device = useSelector(selectDevice);
    const buttonRequests = useSelector(selectDeviceButtonRequestsCodes);
    const [shouldConfirmOnDevice, setShouldConfirmOnDevice] = useState(false);

    const passphraseInputRef = useRef<TextInput>(null);

    const setIsPassphraseModalVisible = useSetAtom(isPassphraseModalVisibleAtom);

    const { applyStyle } = useNativeStyles();

    const form = useForm<PassphraseFormValues>({
        validation: passphraseFormSchema,
        defaultValues: {
            passphrase: '',
        },
    });

    const { handleSubmit } = form;

    useEffect(() => {
        passphraseInputRef.current?.focus();
    }, [passphraseInputRef]);

    useEffect(() => {
        buttonRequests.map(console.log);
        if (buttonRequests.includes('ButtonRequest_ProtectCall')) {
            console.log('enable passphrase');
            setShouldConfirmOnDevice(true);
        }
    }, [buttonRequests]);

    useEffect(() => {
        TrezorConnect.on(UI.CLOSE_UI_WINDOW, () => console.log('should close the window now'));

        return () => TrezorConnect.off(UI.INVALID_PIN, () => null);
    }, []);

    if (!device) return null;

    const handleCreateHiddenWallet = handleSubmit(async values => {
        console.warn(values);
        await dispatch(createDeviceInstance({ device }));
    });

    return (
        <Modal transparent animationType="fade">
            <Box style={applyStyle(modalBackgroundOverlayStyle)}>
                <Form form={form}>
                    <VStack spacing="medium" padding="medium" style={applyStyle(formStyle)}>
                        <TextInputField
                            ref={passphraseInputRef}
                            label="Passphrase"
                            name="passphrase"
                            maxLength={formInputsMaxLength.passphrase}
                            accessibilityLabel="passphrase input"
                            autoCapitalize="none"
                            secureTextEntry
                        />
                        {shouldConfirmOnDevice && (
                            <Text textAlign={'center'}>Confirm on device</Text>
                        )}
                        <VStack>
                            <Button
                                accessibilityRole="button"
                                accessibilityLabel="confirm passphrase"
                                onPress={handleCreateHiddenWallet}
                            >
                                {translate('passphrase.modal.enterWallet')}
                            </Button>
                            <Button
                                accessibilityRole="button"
                                accessibilityLabel="cancel"
                                colorScheme="dangerElevation1"
                                onPress={() => setIsPassphraseModalVisible(false)}
                            >
                                {translate('generic.buttons.close')}
                            </Button>
                        </VStack>
                    </VStack>
                </Form>
            </Box>
        </Modal>
    );
};
