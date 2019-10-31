import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import TrezorConnect from 'trezor-connect';
import l10nCommonMessages from '@suite-support/Messages';
import WebusbButton from '@suite-components/WebusbButton';
import { Wrapper, Text, OnboardingButton } from '@onboarding-components';
import Bridge from './components/Bridge/Container';
import Connect from './components/Connect';
import TroubleshootSearchingTooLong from './components/Connect/TroubleshootTooLong';
import TroubleshootBootloader from './components/Connect/TroubleshootBootloader';
import TroubleshootInitialized from './components/Connect/TroubleshootInitialized';

import l10nMessages from './index.messages';
import { Props } from './Container';

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

    const isWebusb = () => {
        return Boolean(transport && transport.type === 'webusb');
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
                                            <FormattedMessage
                                                {...l10nMessages.TR_FOUND_OK_DEVICE}
                                            />
                                        </Text>
                                        <Wrapper.Controls>
                                            <OnboardingButton.Cta
                                                data-test="@onboarding/button-continue"
                                                onClick={() =>
                                                    props.onboardingActions.goToNextStep()
                                                }
                                            >
                                                <FormattedMessage
                                                    {...l10nCommonMessages.TR_CONTINUE}
                                                />
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
                                {isWebusb() && (
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
                                {!isWebusb() && (
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
                    <TroubleshootSearchingTooLong webusb={isWebusb()} />
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
