import { CardStepper, type CardStepperMap, Text } from '@suite-native/atoms';
import { useBluetoothSettings } from '@suite-native/bluetooth';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';
import { isAndroid } from '@trezor/env-utils';

import { useForgetDevice } from '../hooks/useForgetDevice';

const createStepToContentMap = (openBluetoothSettings: () => void) =>
    ({
        1: {
            header: <Translation id="moduleDeviceSettings.forgetDevice.guide.step1.header" />,
            description: (
                <Translation
                    id="moduleDeviceSettings.forgetDevice.guide.step1.description"
                    values={{
                        link: linkChunk =>
                            isAndroid() ? (
                                <Link
                                    onPress={openBluetoothSettings}
                                    label={linkChunk}
                                    isUnderlined
                                    textVariant="body-md-strong"
                                    textColor="textDefault"
                                    textPressedColor="textSubdued"
                                />
                            ) : (
                                <Text variant="body-md-strong">{linkChunk}</Text>
                            ),
                    }}
                />
            ),
            icon: 'deviceMobileCamera',
        },
        2: {
            header: <Translation id="moduleDeviceSettings.forgetDevice.guide.step2.header" />,
            description: (
                <Translation id="moduleDeviceSettings.forgetDevice.guide.step2.description" />
            ),
            icon: 'trezorSafe7',
        },
    }) as const satisfies CardStepperMap;

export const ForgetDeviceGuideScreen = () => {
    const { openBluetoothSettings } = useBluetoothSettings();
    const { forgetDeviceAndHandleNavigation } = useForgetDevice();

    return (
        <Screen
            header={
                <DynamicScreenHeader
                    title={<Translation id="moduleDeviceSettings.forgetDevice.guide.title" />}
                    closeActionType="close"
                />
            }
        >
            <CardStepper
                stepToContentMap={createStepToContentMap(openBluetoothSettings)}
                primaryButtonText={
                    <Translation id="moduleDeviceSettings.forgetDevice.guide.continueButton" />
                }
                onFinish={forgetDeviceAndHandleNavigation}
            />
        </Screen>
    );
};
