import { Keyboard } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import {
    phishingActions,
    selectDustPhishingIsEnabled,
    selectDustPhishingThreshold,
} from '@suite-common/wallet-core';
import { Button, Card, HStack, PressableOpacity, Switch, Text, VStack } from '@suite-native/atoms';
import { Form, TextInputField } from '@suite-native/forms';
import { Translation, useTranslate } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

import { useDustPhishingForm } from '../hooks/useDustPhishingForm';

export const SettingsDustPhishingScreen = () => {
    const dispatch = useDispatch();
    const { translate } = useTranslate();

    const dustPhishingIsEnabled = useSelector(selectDustPhishingIsEnabled);
    const dustPhishingThreshold = useSelector(selectDustPhishingThreshold);

    const { form, isDisabled } = useDustPhishingForm();

    const onSubmit = form.handleSubmit(values => {
        if (isDisabled) return;

        dispatch(
            phishingActions.setDustPhishing({
                isEnabled: dustPhishingIsEnabled,
                dustThreshold: values.dustThreshold.trim(),
            }),
        );

        Keyboard.dismiss();
    });

    const onSwitchChange = (value: boolean) => {
        dispatch(
            phishingActions.setDustPhishing({
                isEnabled: value,
                dustThreshold: dustPhishingThreshold,
            }),
        );

        form.setValue('dustThreshold', dustPhishingThreshold);
        form.trigger('dustThreshold');
    };

    return (
        <Screen
            header={
                <DynamicScreenHeader
                    title={<Translation id="moduleSettings.advanced.dustPhishing.title" />}
                    subtitle={<Translation id="moduleSettings.advanced.dustPhishing.subtitle" />}
                />
            }
        >
            <VStack spacing="sp16">
                <Card borderColor="borderElevation1" noPadding>
                    <PressableOpacity
                        onPress={() => onSwitchChange(!dustPhishingIsEnabled)}
                        accessibilityLabel=""
                        accessibilityRole="switch"
                        accessibilityState={{ checked: true }}
                    >
                        <HStack margin="sp16" spacing="sp12">
                            <VStack flex={1}>
                                <HStack justifyContent="space-between" flex={1}>
                                    <Text variant="body-md-strong">
                                        <Translation id="moduleSettings.advanced.dustPhishing.enableProtection" />
                                    </Text>
                                    <Switch
                                        isChecked={dustPhishingIsEnabled}
                                        onChange={onSwitchChange}
                                    />
                                </HStack>
                            </VStack>
                        </HStack>
                    </PressableOpacity>
                </Card>

                {dustPhishingIsEnabled && (
                    <Card borderColor="borderElevation1" noPadding>
                        <VStack margin="sp16" spacing="sp12">
                            <HStack justifyContent="space-between" flex={1}>
                                <VStack flex={1} spacing="sp2">
                                    <Text variant="body-md-strong">
                                        <Translation id="moduleSettings.advanced.dustPhishing.dustThresholdTitle" />
                                    </Text>

                                    <Text variant="body-sm" color="textSubdued">
                                        <Translation id="moduleSettings.advanced.dustPhishing.dustThresholdDescription" />
                                    </Text>
                                </VStack>
                            </HStack>

                            <Form form={form}>
                                <VStack>
                                    <TextInputField
                                        name="dustThreshold"
                                        label={translate(
                                            'moduleSettings.advanced.dustPhishing.placeholder',
                                        )}
                                    />

                                    {!isDisabled && (
                                        <Button size="medium" onPress={onSubmit}>
                                            <Translation id="moduleSettings.advanced.dustPhishing.save" />
                                        </Button>
                                    )}
                                </VStack>
                            </Form>
                        </VStack>
                    </Card>
                )}
            </VStack>
        </Screen>
    );
};
