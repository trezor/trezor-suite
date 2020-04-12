import React, { useState } from 'react';
import TrezorConnect from 'trezor-connect';
import { Button } from '@trezor/components';
import { OnboardingButton, Text, Wrapper, Loaders } from '@onboarding-components';
import { Translation, Image, WebusbButton } from '@suite-components';
import { isWebUSB } from '@suite-utils/transport';

import Bridge from './components/Bridge/Container';
import { Props } from './Container';

const PairDeviceStep = (props: Props) => {
    const { device, transport } = props;

    const [imageLoaded, setImageLoaded] = useState(false);

    const isInBlWithFwPresent = () => {
        if (!device) {
            return null;
        }
        return (
            device.features &&
            device.mode === 'bootloader' &&
            device.features.firmware_present === true
        );
    };

    const isDeviceUnreadable = () => {
        return device && device.type === 'unreadable';
    };

    const hasNoTransport = () => transport && !transport.type;

    const isDetectingDevice = () => {
        return Boolean((device && device.features && device.connected) || isDeviceUnreadable());
    };

    const getConnectedDeviceStatus = () => {
        if (isInBlWithFwPresent()) return 'in-bootloader';
        if (device?.features?.initialized) return 'initialized';
        if (device?.features?.no_backup) return 'seedless';
        if (isDeviceUnreadable()) return 'unreadable';
        return 'ok';
    };

    return (
        <Wrapper.Step data-test="@onboarding/pair-device-step">
            <Wrapper.StepHeading>
                <Translation id="TR_CONNECT_YOUR_DEVICE" />
                {!isDetectingDevice() && <Loaders.Dots />}
            </Wrapper.StepHeading>
            <Wrapper.StepBody>
                <WebusbButton ready={imageLoaded} />
                {!hasNoTransport() && (
                    <>
                        <Image
                            image="CONNECT_DEVICE"
                            onLoad={() => setImageLoaded(true)}
                            onError={() => setImageLoaded(true)}
                        />
                        {isDetectingDevice() && (
                            <>
                                {getConnectedDeviceStatus() === 'ok' && (
                                    <>
                                        <Text>
                                            <Translation id="TR_FOUND_OK_DEVICE" />
                                        </Text>
                                        <Wrapper.Controls>
                                            <OnboardingButton.Cta
                                                data-test="@onboarding/button-continue"
                                                onClick={() =>
                                                    props.onboardingActions.goToNextStep()
                                                }
                                            >
                                                <Translation id="TR_CONTINUE" />
                                            </OnboardingButton.Cta>
                                        </Wrapper.Controls>
                                    </>
                                )}
                                {getConnectedDeviceStatus() === 'unreadable' && (
                                    <>
                                        <Text>
                                            <Translation id="TR_YOUR_DEVICE_IS_CONNECTED_BUT_UNREADABLE" />
                                        </Text>
                                        <Wrapper.Controls>
                                            <OnboardingButton.Cta
                                                onClick={() => TrezorConnect.disableWebUSB()}
                                            >
                                                <Translation id="TR_TRY_BRIDGE" />
                                            </OnboardingButton.Cta>
                                        </Wrapper.Controls>
                                    </>
                                )}
                                {getConnectedDeviceStatus() === 'seedless' && (
                                    <Text>
                                        <Translation id="TR_YOUR_DEVICE_IS_SEEDLESS" />
                                    </Text>
                                )}
                            </>
                        )}

                        {!isDetectingDevice() && (
                            <>
                                {isWebUSB(transport) && (
                                    <>
                                        {!isDeviceUnreadable() && (
                                            <Wrapper.Controls>
                                                <WebusbButton ready={imageLoaded}>
                                                    <Button icon="SEARCH">
                                                        <Translation id="TR_CHECK_FOR_DEVICES" />
                                                    </Button>
                                                </WebusbButton>
                                                <OnboardingButton.Alt
                                                    data-test="@onboarding/try-bridge-button"
                                                    onClick={() => TrezorConnect.disableWebUSB()}
                                                >
                                                    <Translation id="TR_TRY_BRIDGE" />
                                                </OnboardingButton.Alt>
                                            </Wrapper.Controls>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </>
                )}
                {hasNoTransport() && <Bridge />}
            </Wrapper.StepBody>
            <Wrapper.StepFooter>
                <Wrapper.Controls>
                    <OnboardingButton.Back
                        onClick={() => props.onboardingActions.goToPreviousStep()}
                    >
                        <Translation id="TR_BACK" />
                    </OnboardingButton.Back>
                </Wrapper.Controls>
            </Wrapper.StepFooter>
        </Wrapper.Step>
    );
};

export default PairDeviceStep;
