import { type ReactNode, use, useState } from 'react';
import { useStore } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { Button, Card, VStack } from '@suite-native/atoms';
import { useDeviceReadyEvents } from '@suite-native/device-authorization';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { throwError } from '@trezor/utils';

import {
    SignVerifyContext,
    type SignVerifyErrors,
    SignVerifyFormContext,
    type SignVerifyValues,
} from './SignVerifyContext';

type NavigationProps = StackNavigationProps<RootStackParamList, RootStackRoutes>;

type SignVerifyFormProps = {
    defaultValues: SignVerifyValues;
    getErrors: (values: SignVerifyValues) => SignVerifyErrors;
    submit: (
        values: SignVerifyValues,
        device: TrezorDevice | undefined,
    ) => Promise<Partial<SignVerifyValues>>;
    children: ReactNode;
};

export const SignVerifyForm = ({
    defaultValues,
    getErrors,
    submit,
    children,
}: SignVerifyFormProps) => {
    const { page, outcome, setOutcome } =
        use(SignVerifyContext) ?? throwError('Missing SignVerify');

    const [values, setValues] = useState(defaultValues);
    const [errors, setErrors] = useState<SignVerifyErrors>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigation = useNavigation<NavigationProps>();
    const { waitForDevice } = useDeviceReadyEvents();
    const store = useStore<DeviceRootState>();

    const update = (changes: Partial<SignVerifyValues>) => {
        const nextValues = { ...values, ...changes };
        setValues(nextValues);
        setErrors(isSubmitted ? getErrors(nextValues) : {});

        // A failed verification comes with no Clear button, editing the values is the way out.
        if (outcome === 'failed') {
            setOutcome(page, 'idle');
        }
    };

    const clear = () => {
        setValues(defaultValues);
        setErrors({});
        setIsSubmitted(false);
        setOutcome(page, 'idle');
    };

    const handleSubmit = async () => {
        const submitErrors = getErrors(values);
        setErrors(submitErrors);
        setIsSubmitted(true);

        if (Object.values(submitErrors).some(error => error !== undefined)) {
            return;
        }

        navigation.navigate(RootStackRoutes.SignVerifyStack);

        if (!(await waitForDevice())) {
            return;
        }

        setIsSubmitting(true);
        try {
            // Read after waiting: the device may have connected while the user was asked for it.
            const changes = await submit(values, selectSelectedDevice(store.getState()));
            setValues(current => ({ ...current, ...changes }));
        } finally {
            setIsSubmitting(false);
            navigation.goBack();
        }
    };

    const isCompleted = outcome === 'signed' || outcome === 'verified';

    return (
        <SignVerifyFormContext value={{ values, errors, update }}>
            <Card>
                <VStack spacing="sp16">
                    {children}
                    {isCompleted ? (
                        <Button onPress={clear} intent="neutral" priority="secondary">
                            <Translation id="signAndVerify.buttons.clear" />
                        </Button>
                    ) : (
                        <Button onPress={handleSubmit} isLoading={isSubmitting}>
                            <Translation
                                id={
                                    page === 'sign'
                                        ? 'signAndVerify.buttons.sign'
                                        : 'signAndVerify.buttons.verify'
                                }
                            />
                        </Button>
                    )}
                </VStack>
            </Card>
        </SignVerifyFormContext>
    );
};
