import { useEffect, useRef } from 'react';
import { Modal, TextInput } from 'react-native';

import { useSetAtom } from 'jotai';

import { Form, TextInputField, useForm } from '@suite-native/forms';
import {
    passphraseFormSchema,
    PassphraseFormValues,
    formInputsMaxLength,
} from '@suite-common/validators';
import { Box, Button, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { useTranslate } from '@suite-native/intl';

import { isPassphraseModalVisibleAtom } from './isPassphraseModalVisibleAtom';

const modalBackgroundOverlayStyle = prepareNativeStyle(utils => ({
    flex: 1,
    backgroundColor: utils.transparentize(0.3, utils.colors.backgroundNeutralBold),
}));

const formStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderBottomLeftRadius: utils.borders.radii.large,
    borderBottomRightRadius: utils.borders.radii.large,
}));

export const PassphraseFormModal = () => {
    const { translate } = useTranslate();

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

    const handleCreateHiddenWallet = handleSubmit(values => {
        console.warn(values);
        setIsPassphraseModalVisible(false);
        // TODO create wallet
    });

    return (
        <Modal transparent>
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
