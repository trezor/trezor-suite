import React, { useEffect, useState } from 'react';
import { P, Tooltip } from '@trezor/components';
import { FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';

import commonMessages from '@suite-support/Messages';

// import * as STEP from '@onboarding-constants/steps';
import colors from '@onboarding-config/colors';
import { FIRMWARE_UPDATE } from '@onboarding-actions/constants/calls';
import * as FIRMWARE_UPDATE_STATUS from '@onboarding-actions/constants/firmwareUpdateStatus';
import Text from '@onboarding-components/Text';
import { ConnectDeviceIcon } from '@onboarding-components/Icons';
import { Donut, Dots } from '@onboarding-components/Loaders';
import { ButtonCta } from '@onboarding-components/Buttons';
import {
    StepWrapper,
    StepHeadingWrapper,
    StepBodyWrapper,
    ControlsWrapper,
} from '@onboarding-components/Wrapper';
import { firmwareUpdate } from '@suite-actions/firmwareActions';
import { goToNextStep } from '@onboarding-actions/onboardingActions';
// import { callActionAndGoToNextStep, resetDevice } from '@suite/actions/onboarding/connectActions';
import l10nMessages from './index.messages';
import { AppState } from '@suite-types';

const DONUT_STROKE = 20;
const DONUT_RADIUS = 60;

interface ButtonProps {
    onClick: () => void;
    isConnected: boolean;
    isInBootloader: boolean;
}

const InstallButton = ({ isConnected, isInBootloader, onClick }: ButtonProps) => (
    <Tooltip
        trigger={isConnected && isInBootloader ? 'manual' : 'mouseenter focus'}
        placement="bottom"
        content={
            !isConnected ? 'Connect device to continue' : !isInBootloader ? 'Go to bootloader' : ''
        }
    >
        <ButtonCta isDisabled={!isConnected || !isInBootloader} onClick={() => onClick()}>
            <FormattedMessage {...l10nMessages.TR_INSTALL} />
        </ButtonCta>
    </Tooltip>
);

const ContinueButton = ({ isConnected, onClick }: Omit<ButtonProps, 'isInBootloader'>) => (
    <Tooltip
        trigger={isConnected ? 'manual' : 'mouseenter focus'}
        placement="bottom"
        content="Connect device to continue"
    >
        <ButtonCta isDisabled={!isConnected} onClick={() => onClick()}>
            Finish basic setup
            {/* <FormattedMessage {...commonMessages.TR_CONTINUE} /> */}
        </ButtonCta>
    </Tooltip>
);

interface Props {
    device: AppState['onboarding']['connect']['device'];
    deviceCall: AppState['onboarding']['connect']['deviceCall'];
    firmwareUpdate: AppState['firmware'];
    firmwareUpdateActions: {
        firmwareUpdate: typeof firmwareUpdate;
    };
    onboardingActions: {
        goToNextStep: typeof goToNextStep;
    };
}

const FirmwareStep = ({
    device,
    deviceCall,
    firmwareUpdate,
    // path,
    onboardingActions,
    firmwareUpdateActions,
    // connectActions,
    intl,
}: Props & InjectedIntlProps) => {
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
        return deviceCall.error || firmwareUpdate.error;
    };

    const getFirmwareStatus = () => {
        if (device.firmware === 'valid') {
            return 'success';
        }

        if (device.firmware === 'outdated' || device.firmware === 'required') {
            return 'outdated';
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
        <StepWrapper>
            <StepHeadingWrapper>
                <FormattedMessage {...l10nMessages.TR_FIRMWARE_HEADING} />
            </StepHeadingWrapper>
            <StepBodyWrapper>
                {/*  text section */}
                {getFirmwareStatus() === 'none' && (
                    <>
                        <Text>
                            <FormattedMessage {...l10nMessages.TR_FIRMWARE_SUBHEADING} />
                        </Text>
                    </>
                )}

                {getFirmwareStatus() === 'outdated' && (
                    <>
                        <Text>
                            <FormattedMessage
                                {...l10nMessages.TR_FIRMWARE_INSTALLED_TEXT}
                                values={{
                                    version: `${device.features.major_version}.${device.features.minor_version}.${device.features.patch_version}`,
                                }}
                            />
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
                        <Donut
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
                                    {getMessageForStatus() && <Dots />}
                                </P>
                                {getUpdateStatus() === 'reconnect' && (
                                    <ConnectDeviceIcon model={device.features.major_version} />
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
                                {firmwareUpdate.error && (
                                    <Text style={{ color: colors.error }}>
                                        <FormattedMessage
                                            {...l10nMessages.TR_FETCH_ERROR_OCCURRED}
                                            values={{ error: firmwareUpdate.error }}
                                        />
                                    </Text>
                                )}
                            </>
                        )}
                    </>
                )}

                {/* buttons section */}
                {(!getUpdateStatus() || getUpdateStatus() === 'done') && (
                    <ControlsWrapper>
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
                                <ButtonCta isDisabled={!isConnected} onClick={() => install()}>
                                    <FormattedMessage {...commonMessages.TR_RETRY} />
                                </ButtonCta>
                            </Tooltip>
                        )}

                        {getFirmwareStatus() === 'outdated' && (
                            <>
                                <InstallButton
                                    isConnected={isConnected}
                                    isInBootloader={isInBootloader}
                                    onClick={() => install()}
                                />
                            </>
                        )}
                        {getFirmwareStatus() === 'success' && (
                            <ContinueButton isConnected={isConnected} onClick={getContinueFn()} />
                        )}
                    </ControlsWrapper>
                )}
            </StepBodyWrapper>
        </StepWrapper>
    );
};

export default injectIntl(FirmwareStep);
