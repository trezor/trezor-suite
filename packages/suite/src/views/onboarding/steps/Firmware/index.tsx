import React, { useEffect, useState } from 'react';
import { P, Tooltip } from '@trezor/components';
import { FormattedMessage } from 'react-intl';

import commonMessages from '@suite-support/Messages';

// import * as STEP from '@onboarding-constants/steps';
import { Text, OnboardingIcon, Loaders, OnboardingButton, Wrapper } from '@onboarding-components';
import l10nMessages from './index.messages';
import { Props } from './Container';

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
                data-test="@onboarding/button-continue"
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
    firmwareUpdate,
    // path,
    onboardingActions,
    firmwareUpdateActions,
    // connectActions,
    intl,
}: Props) => {
    const [maxProgress, setMaxProgress] = useState(0);
    const [progress, setProgress] = useState(0);

    // TODO: add custom handling of is not same device logic

    useEffect(() => {
        if (firmwareUpdate.status === 'waiting-for-confirmation') {
            setMaxProgress(1);
        }
        if (firmwareUpdate.status === 'downloading') {
            setMaxProgress(15);
        }
        if (firmwareUpdate.status === 'installing') {
            setMaxProgress(100);
        }
    }, [firmwareUpdate]);

    useEffect(() => {
        if (!device || !device.features) {
            return;
        }

        let interval: number;

        const runOn = [
            'started',
            'waiting-for-confirmation',
            'installing',
            'downloading',
            'restarting',
        ];

        if (firmwareUpdate.status && runOn.includes(firmwareUpdate.status)) {
            interval = setInterval(
                () => {
                    if (progress < maxProgress) {
                        setProgress(progress + 1);
                    }
                },
                device.features.major_version === 1 ? 170 : 420,
            );
            if (firmwareUpdate.status === 'done') {
                clearInterval(interval);
                return setProgress(100);
            }
        }

        return () => {
            clearInterval(interval);
        };
    }, [firmwareUpdate.status, progress, maxProgress, device]);

    const isConnected = !!device;
    const isInBootloader = Boolean(device && device.features && device.mode === 'bootloader');

    const getFirmwareStatus = () => {
        return device && device.features && device.firmware;
    };

    const getUpdateStatus = () => {
        return firmwareUpdate.status;
    };

    const getMessageForStatus = () => {
        const status = getUpdateStatus();
        if (
            status === 'restarting' &&
            !device &&
            firmwareUpdate.device &&
            firmwareUpdate.device.features &&
            firmwareUpdate.device.features.major_version === 1
        ) {
            return intl.formatMessage(l10nMessages.TR_CONNECT_YOUR_DEVICE_AGAIN);
        }
        if (
            status === 'restarting' &&
            device &&
            device.features &&
            device.features.major_version === 1
        ) {
            return intl.formatMessage(l10nMessages.TR_DISCONNECT_YOUR_DEVICE);
        }
        if (
            status === 'restarting' &&
            device &&
            device.features &&
            device.features.major_version === 2
        ) {
            return intl.formatMessage(l10nMessages.TR_WAIT_FOR_REBOOT);
        }
        if (status === 'waiting-for-confirmation') {
            return 'waiting for confirmation';
        }
        if (status === 'done' || status === 'error') {
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

    const shouldDisplayDonut = () => {
        const status = getUpdateStatus();
        return (
            typeof status === 'string' &&
            [
                'started',
                'waiting-for-confirmation',
                'downloading',
                'installing',
                'restarting',
                'error',
                'done',
            ].includes(status)
        );
    };

    const getVersionStr = () => {
        if (device && device.features) {
            return `${device.features.major_version}.${device.features.minor_version}.${device.features.patch_version}`;
        }
        return '';
    };

    return (
        <Wrapper.Step>
            <Wrapper.StepHeading>
                <FormattedMessage {...l10nMessages.TR_FIRMWARE_HEADING} />
            </Wrapper.StepHeading>
            <Wrapper.StepBody>
                {/*  text section */}
                {getUpdateStatus() === 'initial' && (
                    <>
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
                                    <FormattedMessage
                                        {...l10nMessages.TR_FIRMWARE_INSTALLED_TEXT}
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
                    </>
                )}

                {getUpdateStatus() === 'error' && <></>}

                {getFirmwareStatus() === 'valid' && (
                    <>
                        <Text>
                            <FormattedMessage {...l10nMessages.TR_FIRMWARE_INSTALLED} />
                        </Text>
                    </>
                )}

                {shouldDisplayDonut() && (
                    <>
                        <Loaders.Donut
                            progress={progress}
                            isSuccess={getUpdateStatus() === 'done'}
                            isError={getUpdateStatus() === 'error'}
                        />
                        <P>
                            {getMessageForStatus() && (
                                <>
                                    {getMessageForStatus()}
                                    <Loaders.Dots />
                                </>
                            )}
                        </P>
                        {getUpdateStatus() === 'restarting' &&
                            device &&
                            device.features &&
                            device.features.major_version === 1 && (
                                <OnboardingIcon.ConnectDevice
                                    model={device.features.major_version}
                                />
                            )}
                    </>
                )}
                {getUpdateStatus() === 'error' && <Text>Error</Text>}

                {/* buttons section */}
                <Wrapper.Controls>
                    {getUpdateStatus() === 'initial' && (
                        <>
                            {(getFirmwareStatus() === 'none' ||
                                getFirmwareStatus() === 'unknown') && (
                                <>
                                    <InstallButton
                                        isConnected={isConnected}
                                        isInBootloader={isInBootloader}
                                        onClick={install}
                                    />
                                </>
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
                        </>
                    )}
                    {getFirmwareStatus() === 'valid' && (
                        <ContinueButton
                            isConnected={isConnected}
                            isInBootloader={isInBootloader}
                            onClick={getContinueFn()}
                        />
                    )}
                    {getUpdateStatus() === 'error' &&
                        (getFirmwareStatus() === 'none' || getFirmwareStatus() === 'unknown') && (
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
