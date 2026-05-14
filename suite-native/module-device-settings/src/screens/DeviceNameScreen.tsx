import { Text, TitleHeader, VStack } from '@suite-native/atoms';
import { Form, FormSubmitButton, TextInputField } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';

import { MAX_LENGTH, useChangeDeviceName } from '../hooks/useChangeDeviceName';

export const DeviceNameScreen = () => {
    const { form, device, hintMessage, deviceNameValue, onSubmit, isSubmittable } =
        useChangeDeviceName();

    return (
        <Screen header={<ScreenHeader closeActionType="close" />}>
            <Form form={form}>
                <VStack marginTop="sp32" spacing="sp32" style={{ marginBottom: 'auto' }}>
                    <TitleHeader
                        title={<Translation id="moduleDeviceSettings.changeDeviceName.title" />}
                        titleVariant="headline-md"
                    />
                    <VStack>
                        <TextInputField
                            //  eslint-disable-next-line jsx-a11y/no-autofocus
                            autoFocus
                            keepPlaceholderOnFocus
                            placeholder={device?.name || ''}
                            name="deviceName"
                            autoCorrect={false}
                            keyboardType="ascii-capable"
                            testID="@device-name/input"
                            accessibilityLabel="device name input"
                            hint={hintMessage || ''}
                            maxLength={MAX_LENGTH}
                            rightIcon={
                                <Text variant="body-md" color="contentSecondary">
                                    {`${deviceNameValue.length}/${MAX_LENGTH}`}
                                </Text>
                            }
                        />
                    </VStack>
                </VStack>
                <FormSubmitButton
                    onPress={onSubmit}
                    isVisible={isSubmittable}
                    testID="@device-name/submit-button"
                >
                    <Translation id="moduleDeviceSettings.changeDeviceName.submitButton" />
                </FormSubmitButton>
            </Form>
        </Screen>
    );
};
