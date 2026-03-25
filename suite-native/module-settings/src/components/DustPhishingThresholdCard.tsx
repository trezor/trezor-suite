import { useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { yup } from '@suite-common/validators';
import { phishingActions, selectPhishingDustThreshold } from '@suite-common/wallet-core';
import { Box, Button, Card, HStack, type InputType, Text, VStack } from '@suite-native/atoms';
import { Form, TextInputField, useForm } from '@suite-native/forms';
import { Icon } from '@suite-native/icons';
import { type Translate, Translation, useTranslate } from '@suite-native/intl';

const validateIsNumber = (value?: string) => {
    if (!value || value.trim() === '') return true;
    const number = Number(value.trim());

    return !isNaN(number);
};

const validateIsPositiveNumber = (value?: string) => {
    if (!value || value.trim() === '') return true;
    const number = Number(value.trim());

    return !isNaN(number) && number > 0;
};

const getDustThresholdValidation = (translate: Translate) =>
    yup
        .string()
        .test({
            name: 'is-valid-number',
            message: translate('moduleSettings.phishing.dustThreshold.errors.number'),
            test: validateIsNumber,
        })
        .test({
            name: 'is-positive-number',
            message: translate('moduleSettings.phishing.dustThreshold.errors.positive'),
            test: validateIsPositiveNumber,
        });

export const DustPhishingThresholdCard = () => {
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
            dustThreshold: getDustThresholdValidation(translate),
        }),
    });

    const dustThreshold = form.watch('dustThreshold');

    const errorMessage = form.formState.errors.dustThreshold?.message;
    const isSame = dustThreshold.trim() === (phishingDustThreshold ?? '');
    const isDisabled = !!errorMessage || isSame;
    const isTurningOff = dustThreshold.trim() === '' && !isSame;

    const onSubmit = form.handleSubmit(values => {
        if (isDisabled) return;
        dispatch(phishingActions.setDustThreshold({ dustThreshold: values.dustThreshold.trim() }));
        dustThresholdInputRef.current?.blur();
    });

    return (
        <Card borderColor="borderElevation1" noPadding>
            <HStack margin="sp16" spacing="sp12">
                <Box marginVertical="sp2">
                    <Icon name="warning" size="mediumLarge" />
                </Box>
                <VStack flex={1}>
                    <HStack justifyContent="space-between" flex={1}>
                        <VStack flex={1} spacing="sp2">
                            <Text variant="body-md-strong">
                                <Translation id="moduleSettings.phishing.dustThreshold.title" />
                            </Text>

                            <Text variant="body-sm" color="textSubdued">
                                <Translation id="moduleSettings.phishing.dustThreshold.subtitle" />
                            </Text>
                        </VStack>
                    </HStack>

                    <Form form={form}>
                        <VStack>
                            <TextInputField
                                name="dustThreshold"
                                label={translate('moduleSettings.phishing.settings.placeholder')}
                                ref={dustThresholdInputRef}
                            />

                            {!isDisabled && (
                                <Button
                                    colorScheme={isTurningOff ? 'yellowBold' : 'primary'}
                                    size="small"
                                    onPress={onSubmit}
                                >
                                    <Translation
                                        id={
                                            isTurningOff
                                                ? 'moduleSettings.phishing.settings.turnOff'
                                                : 'moduleSettings.phishing.settings.save'
                                        }
                                    />
                                </Button>
                            )}
                        </VStack>
                    </Form>
                </VStack>
            </HStack>
        </Card>
    );
};
