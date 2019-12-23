import { Loaders, OnboardingButton, OnboardingIcon, Text, Wrapper } from '@onboarding-components';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { P, Tooltip } from '@trezor/components';
import React from 'react';
import ContinueButton from './components/ContinueButton';
import InstallButton from './components/InstallButton';
import { Props } from './Container';

const FirmwareStep = ({
    device,
    firmwareUpdate,
    onboardingActions,
    firmwareUpdateActions,
    intl,
}: // locks,
Props) => {
    // const uiLocked = locks.includes(3);
    const { status, installingProgress, error } = firmwareUpdate;
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

                        {getFirmwareStatus() === 'valid' && (
                            <>
                                <Text>
                                    <Translation {...messages.TR_FIRMWARE_INSTALLED} />
                                </Text>
                            </>
                        )}
                    </>
                )}

                {status === 'done' && (
                    <Text>
                        Excellent, fw update successful, only 6% of user share this experience!
                    </Text>
                )}

                {status === 'partially-done' && (
                    <Text>
                        Update was done, but it was not possible to update your device to the
                        lastest version. Only to an intermediate one. We apologize for
                        inconvenience.
                    </Text>
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
                        {installingProgress && (
                            <Loaders.Donut
                                progress={installingProgress}
                                isSuccess={['unplug', 'wait-for-reboot'].includes(status)}
                                isError={status === 'error'}
                            />
                        )}

                        <P>
                            {getMessageForStatus() && (
                                <>
                                    {getMessageForStatus()}
                                    <Loaders.Dots />
                                </>
                            )}
                        </P>
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
