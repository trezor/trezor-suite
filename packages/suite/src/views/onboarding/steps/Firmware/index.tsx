import React from 'react';
import styled from 'styled-components';

import { Tooltip } from '@trezor/components';

import { Loaders, OnboardingButton, OnboardingIcon, Text, Wrapper } from '@onboarding-components';
import { Translation, Image } from '@suite-components';
import messages from '@suite/support/messages';
import { InitImg, SuccessImg } from '@firmware-components';
import ContinueButton from './components/ContinueButton';
import InstallButton from './components/InstallButton';

import { Props } from './Container';

const InlineLink = styled.span`
    text-decoration: underline;
    cursor: pointer;
`;

const FirmwareStep = ({
    device,
    firmware,
    goToNextStep,
    goToPreviousStep,
    firmwareUpdate,
    toggleBtcOnly,
    intl,
}: Props) => {
    const { status, error, btcOnly } = firmware;
    const isConnected = !!device;
    const isInBootloader = Boolean(device && device.features && device.mode === 'bootloader');

    const getVersionStr = () => {
        if (device && device.features) {
            return `${device.features.major_version}.${device.features.minor_version}.${device.features.patch_version}`;
        }
        return '';
    };

    const getFirmwareStatus = () => {
        if (!device || !device.features) {
            return '';
        }
        return device && device.features && device.firmware;
    };

    const getMessageForStatus = () => {
        if (status === 'unplug' && !device) {
            return intl.formatMessage(messages.TR_CONNECT_YOUR_DEVICE_AGAIN);
        }
        if (status === 'unplug' && device) {
            return intl.formatMessage(messages.TR_DISCONNECT_YOUR_DEVICE);
        }
        if (status === 'wait-for-reboot' && device) {
            return intl.formatMessage(messages.TR_WAIT_FOR_REBOOT);
        }
        if (status === 'waiting-for-confirmation') {
            return 'waiting for confirmation on device';
        }
        if (status === 'done' || status === 'error') {
            return null;
        }
        return intl.formatMessage(messages.TR_INSTALLING);
    };

    const model = device?.features?.major_version || 2;
    const btcOnlyAvailable = device?.features && device.firmwareRelease.release.url_bitcoinonly;

    return (
        <Wrapper.Step>
            <Wrapper.StepHeading>
                <Translation id="TR_FIRMWARE_HEADING" />
            </Wrapper.StepHeading>
            <Wrapper.StepBody>
                {status === 'initial' && (
                    <>
                        {!device && <Translation id="TR_CONNECT_YOUR_DEVICE" />}

                        {getFirmwareStatus() === 'none' && (
                            <>
                                <Text>
                                    <Translation id="TR_FIRMWARE_SUBHEADING" />
                                </Text>
                            </>
                        )}

                        {getFirmwareStatus() === 'outdated' && !isInBootloader && (
                            <>
                                <Text>
                                    <Translation
                                        id="TR_FIRMWARE_INSTALLED_TEXT"
                                        values={{
                                            version: getVersionStr(),
                                        }}
                                    />
                                </Text>
                                <Text>
                                    You might either update your device now or continue and update
                                    it later.
                                </Text>
                            </>
                        )}

                        {getFirmwareStatus() === 'required' && !isInBootloader && (
                            <>
                                <Text>
                                    <Translation
                                        id="TR_FIRMWARE_INSTALLED_TEXT"
                                        values={{
                                            version: getVersionStr(),
                                        }}
                                    />
                                </Text>
                                <Text>
                                    This firmware is not longer supported, you will need to update
                                    it now.
                                </Text>
                            </>
                        )}

                        {['outdated', 'required', 'none'].includes(getFirmwareStatus()) && (
                            <>
                                {btcOnlyAvailable && !btcOnly && (
                                    <Text>
                                        Alternatively you can{' '}
                                        <InlineLink onClick={toggleBtcOnly}>
                                            {' '}
                                            install Bitcoin-only firmware{' '}
                                        </InlineLink>{' '}
                                        (later reverse back to full-featured).
                                    </Text>
                                )}
                                {btcOnlyAvailable && btcOnly && (
                                    <Text>
                                        <InlineLink onClick={toggleBtcOnly}>
                                            Switch back{' '}
                                        </InlineLink>{' '}
                                        to full featured firmware.
                                    </Text>
                                )}

                                <InitImg model={model} />
                            </>
                        )}

                        {getFirmwareStatus() === 'valid' && (
                            <>
                                <Text>
                                    <Translation id="TR_FIRMWARE_INSTALLED" />
                                </Text>
                                <SuccessImg model={model} />
                            </>
                        )}
                    </>
                )}

                {status === 'done' && (
                    <>
                        <Text>
                            Excellent, fw update successful, only 6% of user share this experience!
                        </Text>
                        <SuccessImg model={model} />
                    </>
                )}

                {status === 'partially-done' && (
                    <>
                        <Text>
                            Update was done, but it was not possible to update your device to the
                            lastest version. Only to an intermediate one. We apologize for
                            inconvenience.
                        </Text>
                        <SuccessImg model={model} />
                    </>
                )}

                {status === 'error' && (
                    <>
                        <Text>
                            Ups. Something went wrong with this fw update. Ended up with error:{' '}
                            {error}
                        </Text>
                        <Image image="UNI_ERROR" />
                    </>
                )}

                {[
                    'downloading',
                    'started',
                    'waiting-for-confirmation',
                    'installing',
                    'unplug',
                    'wait-for-reboot',
                ].includes(status) && (
                    <>
                        <InitImg model={model} />

                        <Text>
                            {getMessageForStatus() && (
                                <>
                                    {getMessageForStatus()}
                                    <Loaders.Dots />
                                </>
                            )}
                        </Text>
                        {status === 'unplug' && isConnected && (
                            <OnboardingIcon.ConnectDevice model={1} />
                        )}
                    </>
                )}
                {/* buttons section */}
                <Wrapper.Controls>
                    {['initial', 'done', 'partially-done'].includes(status) && (
                        <>
                            {['none', 'unknown', 'required', 'outdated'].includes(
                                getFirmwareStatus(),
                            ) && (
                                <>
                                    <InstallButton
                                        btcOnly={btcOnly}
                                        isConnected={isConnected}
                                        isInBootloader={isInBootloader}
                                        onClick={firmwareUpdate}
                                    />
                                </>
                            )}

                            {['outdated', 'valid'].includes(getFirmwareStatus()) && (
                                <>
                                    <ContinueButton
                                        isConnected={isConnected}
                                        isInBootloader={isInBootloader}
                                        onClick={goToNextStep}
                                    />
                                </>
                            )}
                        </>
                    )}

                    {status === 'error' && (
                        <Tooltip
                            trigger={isConnected ? 'manual' : 'mouseenter focus'}
                            placement="bottom"
                            content="Connect device to continue"
                        >
                            <OnboardingButton.Cta
                                isDisabled={!isConnected}
                                onClick={firmwareUpdate}
                            >
                                <Translation id="TR_RETRY" />
                            </OnboardingButton.Cta>
                        </Tooltip>
                    )}
                </Wrapper.Controls>
            </Wrapper.StepBody>
            <Wrapper.StepFooter>
                {/* todo add option to switch for btc-only firwmare */}
                {/* {status === 'initial' && (
                    <OnboardingButton.Back onClick={}>
                        Switch to btc only firmware
                    </OnboardingButton.Back>
                )} */}
                <OnboardingButton.Back onClick={() => goToPreviousStep()}>
                    Back
                </OnboardingButton.Back>
            </Wrapper.StepFooter>
        </Wrapper.Step>
    );
};

export default FirmwareStep;
