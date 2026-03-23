import { useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { yup } from '@suite-common/validators';
import { phishingActions, selectPhishingDustThreshold } from '@suite-common/wallet-core';
import { Button, Card, type InputType, Text, VStack } from '@suite-native/atoms';
import { Form, TextInputField, useForm } from '@suite-native/forms';
import { Translation, useTranslate } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

export const SettingsPhishingScreen = () => {
    const dispatch = useDispatch();
    const { translate } = useTranslate();

    const phishingDustThreshold = useSelector(selectPhishingDustThreshold);
    const dustThresholdInputRef = useRef<InputType>(null);

    const form = useForm<{ dustThreshold: string }>({
        mode: 'onChange',
        defaultValues: {
            dustThreshold: phishingDustThreshold ?? '',
        },
        validation: yup.object({
            dustThreshold: yup
                .string()
                .test({
                    name: 'is-valid-number',
                    message: translate('moduleSettings.phishing.dustThreshold.errors.number'),
                    test: value => {
                        if (!value || value.trim() === '') return true;
                        const number = Number(value.trim());

                        return !isNaN(number);
                    },
                })
                .test({
                    name: 'is-positive-number',
                    message: translate('moduleSettings.phishing.dustThreshold.errors.positive'),
                    test: value => {
                        if (!value || value.trim() === '') return true;
                        const number = Number(value.trim());

                        return !isNaN(number) && number > 0;
                    },
                }),
        }),
    });

    const dustThreshold = form.watch('dustThreshold');

    const errorMessage = form.formState.errors.dustThreshold?.message;
    const isSame = dustThreshold.trim() === (phishingDustThreshold ?? '');
    const isDisabled = !!errorMessage || isSame;

    const onSubmit = form.handleSubmit(values => {
        if (isDisabled) return;
        dispatch(phishingActions.setDustThreshold({ dustThreshold: values.dustThreshold.trim() }));
        dustThresholdInputRef.current?.blur();
    });

    return (
        <Screen
            header={
                <DynamicScreenHeader
                    title={<Translation id="moduleSettings.phishing.settings.title" />}
                    subtitle={<Translation id="moduleSettings.phishing.settings.subtitle" />}
                />
            }
        >
            <Card>
                <VStack spacing="sp12">
                    <Text variant="headline-sm">
                        <Translation id="moduleSettings.phishing.dustThreshold.title" />
                    </Text>

                    <Text variant="body-xs" color="textSubdued">
                        <Translation id="moduleSettings.phishing.dustThreshold.subtitle" />
                    </Text>

                    <Form form={form}>
                        <VStack>
                            <TextInputField
                                name="dustThreshold"
                                label={translate('moduleSettings.phishing.settings.placeholder')}
                                ref={dustThresholdInputRef}
                            />

                            {!isDisabled && (
                                <Button size="small" onPress={onSubmit}>
                                    <Translation id="moduleSettings.phishing.settings.save" />
                                </Button>
                            )}
                        </VStack>
                    </Form>
                </VStack>
            </Card>
        </Screen>
    );
};
