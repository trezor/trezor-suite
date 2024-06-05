import React, { ReactNode, useState } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { PassphraseFormValues, passphraseFormSchema } from '@suite-common/validators';
import { selectDevice, deviceActions, onPassphraseSubmit } from '@suite-common/wallet-core';
import { Form, useForm } from '@suite-native/forms';
import {
    PassphraseStackRoutes,
    StackToStackCompositeNavigationProps,
    PassphraseStackParamList,
    RootStackParamList,
} from '@suite-native/navigation';
import { TextDivider, VStack } from '@suite-native/atoms';

import { PassphraseContentScreenWrapper } from './PassphraseContentScreenWrapper';
import { PassphraseFormButtonFooter } from './PassphraseFormButtonFooter';
import { PassphraseFormInput } from './PassphraseFormInput';
import { EnterPassphraseOnTrezorButton } from './EnterPassphraseOnTrezorButton';

type PassphraseFormScreenWrapper = {
    children: ReactNode;
    title: ReactNode;
    inputLabel: string;
    subtitle?: ReactNode;
    onFormFocus?: () => void;
};

type NavigationProp = StackToStackCompositeNavigationProps<
    PassphraseStackParamList,
    PassphraseStackRoutes.PassphraseForm,
    RootStackParamList
>;

export const PassphraseFormScreenWrapper = ({
    children,
    title,
    inputLabel,
    subtitle,
    onFormFocus,
}: PassphraseFormScreenWrapper) => {
    const dispatch = useDispatch();
    const [isInputFocused, setIsInputFocused] = useState(false);

    const device = useSelector(selectDevice);

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

    const handleFocus = () => {
        onFormFocus?.();
        setIsInputFocused(true);
    };

    const handleBlur = () => {
        setIsInputFocused(false);
    };

    return (
        <PassphraseContentScreenWrapper
            title={title}
            subtitle={subtitle}
            footer={
                <PassphraseFormButtonFooter
                    isVisible={isDirty}
                    onPress={handleCreateHiddenWallet}
                />
            }
        >
            <VStack spacing="medium" flex={1} style={{ paddingBottom: isDirty ? 70 : 0 }}>
                {children}
                <Form form={form}>
                    <PassphraseFormInput
                        inputLabel={inputLabel}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                    />
                    {!isDirty && !isInputFocused && (
                        <Animated.View entering={FadeIn} exiting={FadeOut}>
                            <VStack>
                                <TextDivider title="generic.orSeparator" horizontalMargin={12} />
                                <EnterPassphraseOnTrezorButton />
                            </VStack>
                        </Animated.View>
                    )}
                </Form>
            </VStack>
        </PassphraseContentScreenWrapper>
    );
};
