import { OnboardingButton, Text, Wrapper } from '@onboarding-components';
import { Translation } from '@suite-components/Translation';
import WebusbButton from '@suite-components/WebusbButton';
import messages from '@suite/support/messages';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import TrezorConnect from 'trezor-connect';

import Bridge from './components/Bridge/Container';
import Connect from './components/Connect';
import TroubleshootBootloader from './components/Connect/TroubleshootBootloader';
import TroubleshootInitialized from './components/Connect/TroubleshootInitialized';
import TroubleshootSearchingTooLong from './components/Connect/TroubleshootTooLong';
import { Props } from './Container';
import { isWebUSB } from '@suite-utils/device';

const WebusbButtonWrapper = styled.div`
    width: 200px;
`;

const PairDeviceStep = (props: Props) => {
    const { device, transport, model } = props;
    const [showTroubleshoot, setShowTroubleshoot] = useState(false);

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

    useEffect(() => {
        if (transport && transport.type) {
            setShowTroubleshoot(false);
        }
    }, [transport]);

    const actualModel = device && device.features && device.features.major_version;

    return (
        <Wrapper.Step data-test="@onboarding/pair-device-step">
            <Wrapper.StepHeading>Pair device</Wrapper.StepHeading>
            <Wrapper.StepBody>
                {!showTroubleshoot && !hasNoTransport() && (
                    <>
                        <Connect
                            model={actualModel || model}
                            deviceIsConnected={isDetectingDevice()}
                        />

                        {isDetectingDevice() && (
                            <>
                                {getConnectedDeviceStatus() === 'in-bootloader' && (
                                    <TroubleshootBootloader />
                                )}
                                {getConnectedDeviceStatus() === 'initialized' && (
                                    <TroubleshootInitialized />
                                )}
                                {getConnectedDeviceStatus() === 'seedles' && (
                                    <div>
                                        Device is in a seedles mode and is not allowed to be used
                                        here.
                                    </div>
                                )}
                                {getConnectedDeviceStatus() === 'ok' && (
                                    <>
                                        <Text>
                                            <Translation {...messages.TR_FOUND_OK_DEVICE} />
                                        </Text>
                                        <Wrapper.Controls>
                                            <OnboardingButton.Cta
                                                data-test="@onboarding/button-continue"
                                                onClick={() =>
                                                    props.onboardingActions.goToNextStep()
                                                }
                                            >
                                                <Translation {...messages.TR_CONTINUE} />
                                            </OnboardingButton.Cta>
                                        </Wrapper.Controls>
                                    </>
                                )}
                                {getConnectedDeviceStatus() === 'unreadable' && (
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
                                )}
                            </>
                        )}

                        {!isDetectingDevice() && (
                            <>
                                {isWebUSB(transport) && (
                                    <>
                                        {!isDeviceUnreadable() && (
                                            <Wrapper.Controls>
                                                <WebusbButtonWrapper>
                                                    <WebusbButton ready />
                                                </WebusbButtonWrapper>
                                                <OnboardingButton.Alt
                                                    onClick={() => setShowTroubleshoot(true)}
                                                >
                                                    Troubleshoot
                                                </OnboardingButton.Alt>
                                            </Wrapper.Controls>
                                        )}
                                    </>
                                )}
                                {!isWebUSB(transport) && (
                                    <Wrapper.Controls>
                                        <OnboardingButton.Alt
                                            onClick={() => setShowTroubleshoot(true)}
                                        >
                                            Troubleshoot
                                        </OnboardingButton.Alt>
                                    </Wrapper.Controls>
                                )}
                            </>
                        )}
                    </>
                )}
                {hasNoTransport() && <Bridge />}

                {showTroubleshoot && !hasNoTransport() && (
                    <TroubleshootSearchingTooLong webusb={isWebUSB(transport)} />
                )}
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
