import React, { useState } from 'react';
import styled from 'styled-components';
import TrezorConnect from 'trezor-connect';

import { OnboardingButton, Text, Wrapper, Loaders } from '@onboarding-components';
import { Translation, Image } from '@suite-components';
import WebusbButton from '@suite-components/WebusbButton';
import { isWebUSB } from '@suite-utils/transport';

import Bridge from './components/Bridge/Container';
import { Props } from './Container';

const WebusbButtonWrapper = styled.div`
    width: 200px;
`;

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
        if (device && device.features && device.features.initialized) return 'initialized';
        if (device && device.features && device.features.no_backup) return 'seedles';
        if (isDeviceUnreadable()) return 'unreadable';
        return 'ok';
    };

    return (
        <Wrapper.Step data-test="@onboarding/pair-device-step">
            <Wrapper.StepHeading>
                Connect Trezor to continue
                {!isDetectingDevice() && <Loaders.Dots />}
            </Wrapper.StepHeading>
            <Wrapper.StepBody>
                {!hasNoTransport() && (
                    <>
                        <Image
                            image="CONNECT_DEVICE"
                            onLoad={() => setImageLoaded(true)}
                            onError={() => setImageLoaded(true)}
                        />
                        {isDetectingDevice() && (
                            <>
                                {/* {getConnectedDeviceStatus() === 'initialized' && (
                                    <TroubleshootInitialized />
                                )} */}
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
                                {/* ???? */}
                                {/* todo todo todo: we had a nice logic for disabling webusb. maybe implement
                                into common unreadable modal? */}
                                {/* {getConnectedDeviceStatus() === 'unreadable' && (
                                    <>
                                        <Text>
                                            Your device is connected properly, but web interface can
                                            not communicate with it now. You will need to install
                                            special communication daemon.
                                        </Text>

                                        <OnboardingButton.Cta
                                            onClick={() => TrezorConnect.disableWebUSB()}
                                        >
                                            Try bridge
                                        </OnboardingButton.Cta>
                                    </>
                                )} */}
                            </>
                        )}

                        {!isDetectingDevice() && (
                            <>
                                {isWebUSB(transport) && (
                                    <>
                                        {!isDeviceUnreadable() && (
                                            <Wrapper.Controls>
                                                <WebusbButtonWrapper>
                                                    <WebusbButton ready={imageLoaded} />
                                                </WebusbButtonWrapper>
                                                <OnboardingButton.Alt
                                                    data-test="@onboarding/try-bridge-button"
                                                    onClick={() => TrezorConnect.disableWebUSB()}
                                                >
                                                    Try bridge
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
                        Back
                    </OnboardingButton.Back>
                </Wrapper.Controls>
            </Wrapper.StepFooter>
        </Wrapper.Step>
    );
};

export default PairDeviceStep;
