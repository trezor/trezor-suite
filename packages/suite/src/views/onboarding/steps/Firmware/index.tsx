import React, { useEffect, useState } from 'react';
import { P, Tooltip } from '@trezor/components';
import { FormattedMessage } from 'react-intl';

import commonMessages from '@suite-support/Messages';

// import * as STEP from '@onboarding-constants/steps';
import colors from '@onboarding-config/colors';
import { FIRMWARE_UPDATE } from '@onboarding-actions/constants/calls';
import * as FIRMWARE_UPDATE_STATUS from '@onboarding-actions/constants/firmwareUpdateStatus';
import { Text, OnboardingIcon, Loaders, OnboardingButton, Wrapper } from '@onboarding-components';
import l10nMessages from './index.messages';
import { Props } from './Container';

const DONUT_STROKE = 20;
const DONUT_RADIUS = 60;

interface ButtonProps {
    onClick: () => void;
    isConnected: boolean;
    isInBootloader: boolean;
}

const InstallButton = ({ isConnected, isInBootloader, onClick }: ButtonProps) => {
    let content = '';
    if (!isConnected) {
        content = 'Connect device to continue';
    } else if (!isInBootloader) {
        content = 'Go to bootloader';
    }
    return (
        <Tooltip
            trigger={isConnected && isInBootloader ? 'manual' : 'mouseenter focus'}
            placement="bottom"
            content={content}
        >
            <OnboardingButton.Cta
                isDisabled={!isConnected || !isInBootloader}
                onClick={() => onClick()}
            >
                <FormattedMessage {...l10nMessages.TR_INSTALL} />
            </OnboardingButton.Cta>
        </Tooltip>
    );
};

const ContinueButton = ({ isConnected, isInBootloader, onClick }: ButtonProps) => {
    let content = '';
    if (!isConnected) {
        content = 'Connect device to continue';
    } else if (isInBootloader) {
        content = 'Leave bootloader mode to continue';
    }
    return (
        <Tooltip
            trigger={isConnected && !isInBootloader ? 'manual' : 'mouseenter focus'}
            placement="bottom"
            content={content}
        >
            <OnboardingButton.Cta
                isDisabled={!isConnected || isInBootloader}
                onClick={() => onClick()}
            >
                <FormattedMessage {...commonMessages.TR_CONTINUE} />
            </OnboardingButton.Cta>
        </Tooltip>
    );
};

const FirmwareStep = ({
    device,
    deviceCall,
    firmwareUpdate,
    // path,
    onboardingActions,
    firmwareUpdateActions,
    // connectActions,
    intl,
}: Props) => {
    const [maxProgress, setMaxProgress] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (firmwareUpdate.status === FIRMWARE_UPDATE_STATUS.DONE || deviceCall.error) {
            setProgress(100);
        }
    }, [firmwareUpdate.status, deviceCall]);

    useEffect(() => {
        if (firmwareUpdate.status === FIRMWARE_UPDATE_STATUS.DOWNLOADING) {
            setMaxProgress(10);
        }
        if (firmwareUpdate.status === FIRMWARE_UPDATE_STATUS.INSTALLING) {
            setMaxProgress(99);
        }
        if (firmwareUpdate.status === FIRMWARE_UPDATE_STATUS.DONE) {
            setMaxProgress(100);
        }
    }, [firmwareUpdate.status]);

    useEffect(() => {
        let interval: number;

        const runOn = [
            FIRMWARE_UPDATE_STATUS.STARTED,
            FIRMWARE_UPDATE_STATUS.INSTALLING,
            FIRMWARE_UPDATE_STATUS.DOWNLOADING,
        ];
        if (firmwareUpdate.status && runOn.includes(firmwareUpdate.status)) {
            interval = setInterval(
                () => {
                    if (progress < maxProgress) {
                        setProgress(progress + 1);
                    }
                },
                device.features.major_version === 1 ? 170 : 561,
            );
        }
        return () => {
            clearInterval(interval);
        };
    }, [firmwareUpdate.status, progress, maxProgress, device.features.major_version]);

    const isConnected = device && device.connected;
    const isInBootloader = device && device.mode === 'bootloader';

    const getError = () => {
        return deviceCall.error;
    };

    const getFirmwareStatus = () => {
        if (device.firmware === 'valid') {
            return 'success';
        }

        if (device.firmware === 'outdated') {
            return 'outdated';
        }

        if (device.firmware === 'required') {
            return 'required';
        }

        if (device.firmware === 'none' || device.firmware === 'unknown') {
            return 'none';
        }

        return null;
    };

    const getUpdateStatus = () => {
        if (
            deviceCall.name === FIRMWARE_UPDATE &&
            deviceCall.result &&
            device.firmware !== 'valid'
        ) {
            return 'reconnect';
        }
        return firmwareUpdate.status;
    };

    const getMessageForStatus = () => {
        const status = getUpdateStatus();
        if (status === 'reconnect' && !device.connected && device.features.major_version === 1) {
            return intl.formatMessage(l10nMessages.TR_CONNECT_YOUR_DEVICE_AGAIN);
        }
        if (status === 'reconnect' && device.connected && device.features.major_version === 1) {
            return intl.formatMessage(l10nMessages.TR_DISCONNECT_YOUR_DEVICE);
        }
        if (status === 'reconnect' && device.features.major_version === 2) {
            return intl.formatMessage(l10nMessages.TR_WAIT_FOR_REBOOT);
        }
        if (status === 'done') {
            return null;
        }
        return intl.formatMessage(l10nMessages.TR_INSTALLING);
    };

    const install = () => {
        setProgress(0);
        setMaxProgress(0);
        firmwareUpdateActions.firmwareUpdate();
    };

    const getContinueFn = () => {
        return () => onboardingActions.goToNextStep();
    };

    return (
        <Wrapper.Step>
            <Wrapper.StepHeading>
                <FormattedMessage {...l10nMessages.TR_FIRMWARE_HEADING} />
            </Wrapper.StepHeading>
            <Wrapper.StepBody>
                {/*  text section */}
                {getFirmwareStatus() === 'none' && (
                    <>
                        <Text>
                            <FormattedMessage {...l10nMessages.TR_FIRMWARE_SUBHEADING} />
                        </Text>
                    </>
                )}

                {getFirmwareStatus() === 'outdated' && !isInBootloader && (
                    <>
                        <Text>
                            <FormattedMessage
                                {...l10nMessages.TR_FIRMWARE_INSTALLED_TEXT}
                                values={{
                                    version: `${device.features.major_version}.${device.features.minor_version}.${device.features.patch_version}`,
                                }}
                            />
                        </Text>
                        <Text>
                            You might either update your device now or continue and update it later.
                        </Text>
                    </>
                )}

                {getFirmwareStatus() === 'required' && !isInBootloader && (
                    <>
                        <Text>
                            <FormattedMessage
                                {...l10nMessages.TR_FIRMWARE_INSTALLED_TEXT}
                                values={{
                                    version: `${device.features.major_version}.${device.features.minor_version}.${device.features.patch_version}`,
                                }}
                            />
                        </Text>
                        <Text>
                            This firmware is not longer supported, you will need to update it now.
                        </Text>
                    </>
                )}

                {getFirmwareStatus() === 'success' && (
                    <>
                        <Text>
                            <FormattedMessage {...l10nMessages.TR_FIRMWARE_INSTALLED} />
                        </Text>
                    </>
                )}

                {/* progress donut section */}
                {getUpdateStatus() && (
                    <>
                        <Loaders.Donut
                            progress={progress}
                            radius={DONUT_RADIUS}
                            stroke={DONUT_STROKE}
                            isSuccess={getFirmwareStatus() === 'success'}
                            isError={!!getError()}
                        />
                        {!getError() && (
                            <>
                                <P>
                                    {getMessageForStatus()}
                                    {getMessageForStatus() && <Loaders.Dots />}
                                </P>
                                {getUpdateStatus() === 'reconnect' && (
                                    <OnboardingIcon.ConnectDevice
                                        model={device.features.major_version}
                                    />
                                )}
                            </>
                        )}
                        {getError() && (
                            <>
                                {deviceCall.error && (
                                    <Text style={{ color: colors.error }}>
                                        <FormattedMessage
                                            {...l10nMessages.TR_INSTALL_ERROR_OCCURRED}
                                            values={{ error: deviceCall.error }}
                                        />
                                    </Text>
                                )}
                                {/* todo: rework with notifications */}
                                {/* {firmwareUpdate.error && (
                                    <Text style={{ color: colors.error }}>
                                        <FormattedMessage
                                            {...l10nMessages.TR_FETCH_ERROR_OCCURRED}
                                            values={{ error: firmwareUpdate.error }}
                                        />
                                    </Text>
                                )} */}
                            </>
                        )}
                    </>
                )}

                {/* buttons section */}
                {(!getUpdateStatus() || getUpdateStatus() === 'done') && (
                    <Wrapper.Controls>
                        {getFirmwareStatus() === 'none' && !getError() && (
                            <>
                                <InstallButton
                                    isConnected={isConnected}
                                    isInBootloader={isInBootloader}
                                    onClick={install}
                                />
                            </>
                        )}
                        {getFirmwareStatus() === 'none' && getError() && (
                            <Tooltip
                                trigger={isConnected ? 'manual' : 'mouseenter focus'}
                                placement="bottom"
                                content="Connect device to continue"
                            >
                                <OnboardingButton.Cta
                                    isDisabled={!isConnected}
                                    onClick={() => install()}
                                >
                                    <FormattedMessage {...commonMessages.TR_RETRY} />
                                </OnboardingButton.Cta>
                            </Tooltip>
                        )}

                        {getFirmwareStatus() === 'outdated' && (
                            <>
                                <InstallButton
                                    isConnected={isConnected}
                                    isInBootloader={isInBootloader}
                                    onClick={() => install()}
                                />
                                <ContinueButton
                                    isConnected={isConnected}
                                    isInBootloader={isInBootloader}
                                    onClick={getContinueFn()}
                                />
                            </>
                        )}
                        {getFirmwareStatus() === 'required' && (
                            <>
                                <InstallButton
                                    isConnected={isConnected}
                                    isInBootloader={isInBootloader}
                                    onClick={() => install()}
                                />
                            </>
                        )}
                        {getFirmwareStatus() === 'success' && (
                            <ContinueButton
                                isConnected={isConnected}
                                isInBootloader={isInBootloader}
                                onClick={getContinueFn()}
                            />
                        )}
                    </Wrapper.Controls>
                )}
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
