// import { useDispatch } from 'react-redux';
import { useEffect, useRef } from 'react';
import { TextInput } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { useSetAtom } from 'jotai';

import { Button, VStack } from '@suite-native/atoms';
import { Form, TextInputField, useForm } from '@suite-native/forms';
import {
    formInputsMaxLength,
    passphraseFormSchema,
    PassphraseFormValues,
} from '@suite-common/validators';
import { useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { deviceActions, onPassphraseSubmit, selectDevice } from '@suite-common/wallet-core';

import { isPassphraseModalVisibleAtom } from './isPassphraseModalVisibleAtom';

export const formStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderRadius: utils.borders.radii.large,
    margin: utils.spacings.medium,
}));

export const PassphraseForm = () => {
    const dispatch = useDispatch();

    const device = useSelector(selectDevice);

    const { applyStyle } = useNativeStyles();

    const { translate } = useTranslate();

    const form = useForm<PassphraseFormValues>({
        validation: passphraseFormSchema,
        defaultValues: {
            passphrase: '',
        },
    });

    const passphraseInputRef = useRef<TextInput>(null);

    const { handleSubmit } = form;

    const setIsPassphraseModalVisible = useSetAtom(isPassphraseModalVisibleAtom);

    useEffect(() => {
        passphraseInputRef.current?.focus();
    }, [passphraseInputRef]);

    if (!device) return null;

    const handleCreateHiddenWallet = handleSubmit(({ passphrase }) => {
        console.warn(passphrase);
        dispatch(onPassphraseSubmit({ value: passphrase, passphraseOnDevice: false }));
        setIsPassphraseModalVisible(false);
        dispatch(deviceActions.removeButtonRequests({ device }));
    });

    const handleClose = () => {
        // TODO this disconnects both instances, needs to be better
        dispatch(deviceActions.deviceDisconnect(device));
        setIsPassphraseModalVisible(false);
    };

    const handleGoToDefaultWallet = () => {
        dispatch(onPassphraseSubmit({ value: '', passphraseOnDevice: false }));
        setIsPassphraseModalVisible(false);
        dispatch(deviceActions.removeButtonRequests({ device }));
    };

    return (
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
                {/* {shouldConfirmOnDevice && <Text textAlign={'center'}>Confirm on device</Text>} */}
                <VStack>
                    <Button onPress={handleGoToDefaultWallet}>Go to default wallet</Button>
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
                        onPress={handleClose}
                    >
                        {translate('generic.buttons.close')}
                    </Button>
                </VStack>
            </VStack>
        </Form>
    );
};
