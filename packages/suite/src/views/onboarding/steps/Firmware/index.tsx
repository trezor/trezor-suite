import React from 'react';
import { Tooltip } from '@trezor/components';

import { Loaders, OnboardingButton, OnboardingIcon, Text, Wrapper } from '@onboarding-components';
import { Translation } from '@suite-components';
import messages from '@suite/support/messages';
import { InitImg, SuccessImg } from '@firmware-components';
import ContinueButton from './components/ContinueButton';
import InstallButton from './components/InstallButton';

import { Props } from './Container';

const FirmwareStep = ({
    device,
    firmwareUpdate,
    onboardingActions,
    firmwareUpdateActions,
    intl,
}: Props) => {
    const { status, error } = firmwareUpdate;
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

    return (
        <Wrapper.Step>
            <Wrapper.StepHeading>
                <Translation {...messages.TR_FIRMWARE_HEADING} />
            </Wrapper.StepHeading>
            <Wrapper.StepBody>
                {status === 'initial' && (
                    <>
                        {!device && 'connect device'}

                        {getFirmwareStatus() === 'none' && (
                            <>
                                <Text>
                                    <Translation {...messages.TR_FIRMWARE_SUBHEADING} />
                                </Text>
                            </>
                        )}

                        {getFirmwareStatus() === 'outdated' && !isInBootloader && (
                            <>
                                <Text>
                                    <Translation
                                        {...messages.TR_FIRMWARE_INSTALLED_TEXT}
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
                                        {...messages.TR_FIRMWARE_INSTALLED_TEXT}
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
                            <InitImg />
                        )}

                        {getFirmwareStatus() === 'valid' && (
                            <>
                                <Text>
                                    <Translation {...messages.TR_FIRMWARE_INSTALLED} />
                                </Text>
                                <SuccessImg />
                            </>
                        )}
                    </>
                )}

                {status === 'done' && (
                    <>
                        <Text>
                            Excellent, fw update successful, only 6% of user share this experience!
                        </Text>
                        <SuccessImg />
                    </>
                )}

                {status === 'partially-done' && (
                    <>
                        <Text>
                            Update was done, but it was not possible to update your device to the
                            lastest version. Only to an intermediate one. We apologize for
                            inconvenience.
                        </Text>
                        <SuccessImg />
                    </>
                )}

                {status === 'error' && (
                    <Text>
                        Ups. Something went wrong with this fw update. Ended up with error: {error}
                    </Text>
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
                        <InitImg />

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
                                        isConnected={isConnected}
                                        isInBootloader={isInBootloader}
                                        onClick={firmwareUpdateActions.firmwareUpdate}
                                    />
                                </>
                            )}

                            {['outdated', 'valid'].includes(getFirmwareStatus()) && (
                                <>
                                    <ContinueButton
                                        isConnected={isConnected}
                                        isInBootloader={isInBootloader}
                                        onClick={onboardingActions.goToNextStep}
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
                                onClick={firmwareUpdateActions.firmwareUpdate}
                            >
                                <Translation {...messages.TR_RETRY} />
                            </OnboardingButton.Cta>
                        </Tooltip>
                    )}
                </Wrapper.Controls>
            </Wrapper.StepBody>
            <Wrapper.StepFooter>
                <OnboardingButton.Back onClick={() => onboardingActions.goToPreviousStep()}>
                    Back
                </OnboardingButton.Back>
            </Wrapper.StepFooter>
        </Wrapper.Step>
    );
};

export default FirmwareStep;
