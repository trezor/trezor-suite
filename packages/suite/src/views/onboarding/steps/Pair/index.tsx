import React, { useState } from 'react';
import styled from 'styled-components';
import TrezorConnect from 'trezor-connect';
import { Button } from '@trezor/components';
import { OnboardingButton, Text, Wrapper, Loaders } from '@onboarding-components';
import { Translation, WebusbButton, Image, ConnectDeviceImage } from '@suite-components';
import { isWebUSB } from '@suite-utils/transport';

import Bridge from './components/Bridge/Container';
import { Props } from './Container';

const StyledImage = styled(Image)`
    flex: 1;
`;
const StyledConnectDeviceImage = styled(ConnectDeviceImage)`
    flex: 1;
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

    const hasTransport = () => transport && transport.type;

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

    const getHeading = () => {
        if (hasTransport() && isDetectingDevice()) {
            if (getConnectedDeviceStatus() === 'ok') {
                return <Translation id="TR_YOUR_TREZOR_IS_ALMOST_READY" />;
            }
            if (getConnectedDeviceStatus() === 'initialized') {
                return <Translation id="TR_THIS_TREZOR_IS_ALREADY_SET_UP" />;
            }
        }
        return <Translation id="TR_CONNECT_YOUR_DEVICE" />;
    };

    return (
        <Wrapper.Step data-test="@onboarding/pair-device-step">
            <Wrapper.StepHeading>
                {getHeading()}
                {!isDetectingDevice() && <Loaders.Dots />}
            </Wrapper.StepHeading>
            <Wrapper.StepBody>
                {!hasTransport() && <Bridge />}

                {hasTransport() && (
                    <>
                        {isDetectingDevice() && (
                            <>
                                {getConnectedDeviceStatus() === 'initialized' && (
                                    <>
                                        <Text>
                                            <Translation id="ONBOARDING_PAIR_ALREADY_INITIALIZED" />
                                        </Text>
                                        <StyledImage image="UNI_WARNING" />
                                        <Wrapper.Controls>
                                            <OnboardingButton.Cta
                                                data-test="@onboarding/button-continue"
                                                onClick={() => props.goto('suite-index')}
                                            >
                                                <Translation id="TR_GO_TO_SUITE" />
                                            </OnboardingButton.Cta>
                                        </Wrapper.Controls>
                                    </>
                                )}
                                {getConnectedDeviceStatus() === 'ok' && (
                                    <>
                                        <Text>
                                            <Translation id="TR_FOUND_OK_DEVICE" />
                                        </Text>
                                        <StyledImage image="UNI_SUCCESS" />
                                        <Wrapper.Controls>
                                            <OnboardingButton.Cta
                                                data-test="@onboarding/button-continue"
                                                onClick={() => props.goToNextStep()}
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
                                        <StyledImage image="UNI_WARNING" />
                                        <Wrapper.Controls>
                                            <OnboardingButton.Cta
                                                onClick={() => TrezorConnect.disableWebUSB()}
                                            >
                                                <Translation id="TR_TRY_BRIDGE" />
                                            </OnboardingButton.Cta>
                                        </Wrapper.Controls>
                                    </>
                                )}
                                {getConnectedDeviceStatus() === 'in-bootloader' && (
                                    <>
                                        <Text>
                                            <Translation id="TR_CONNECTED_DEVICE_IS_IN_BOOTLOADER" />
                                        </Text>
                                        <StyledImage image="UNI_WARNING" />
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
                                <StyledConnectDeviceImage
                                    onLoad={() => setImageLoaded(true)}
                                    onError={() => setImageLoaded(true)}
                                />
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
            </Wrapper.StepBody>
            <Wrapper.StepFooter>
                <Wrapper.Controls>
                    <OnboardingButton.Back onClick={() => props.goToPreviousStep()}>
                        <Translation id="TR_BACK" />
                    </OnboardingButton.Back>
                </Wrapper.Controls>
            </Wrapper.StepFooter>
        </Wrapper.Step>
    );
};

export default PairDeviceStep;
