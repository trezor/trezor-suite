import React from 'react';
import { P, Button, Tooltip } from '@trezor/components';
import { FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';

import colors from '@suite/config/onboarding/colors';
import { GET_FIRMWARE } from '@suite/actions/onboarding/constants/fetchCalls';
import { FIRMWARE_ERASE, FIRMWARE_UPLOAD } from '@suite/actions/onboarding/constants/calls';
import commonMessages from '@suite/support/commonMessages';

import Text from '@suite/components/onboarding/Text';
import { ConnectDeviceIcon } from '@suite/components/onboarding/Icons';
import { Donut, Dots } from '@suite/components/onboarding/Loaders';
import {
    StepWrapper,
    StepHeadingWrapper,
    StepBodyWrapper,
    ControlsWrapper,
} from '@suite/components/onboarding/Wrapper';

import { ConnectReducer } from '@suite/types/onboarding/connect';
import { FetchReducer } from '@suite/types/onboarding/fetch';
import {
    FirmwareUpdateReducer,
    FirmwareUpdateActions,
} from '@suite/types/onboarding/firmwareUpdate';
import { OnboardingActions } from '@suite/types/onboarding/onboarding';

import l10nMessages from './index.messages';

const DONUT_STROKE = 20;
const DONUT_RADIUS = 60;

interface Props {
    device: ConnectReducer['device'];
    deviceCall: ConnectReducer['deviceCall'];
    fetchCall: FetchReducer;
    firmwareUpdateActions: FirmwareUpdateActions;
    firmwareUpdate: FirmwareUpdateReducer;
    onboardingActions: OnboardingActions;
}

class FirmwareStep extends React.Component<Props & InjectedIntlProps> {
    getStatus() {
        const { device, fetchCall, deviceCall } = this.props;

        if (device.firmware === 'valid') {
            return 'success';
        }

        if (deviceCall.error) {
            return 'deviceCall-error';
        }

        if (fetchCall.error) {
            return 'fetchCall-error';
        }

        if (deviceCall.name === FIRMWARE_UPLOAD && deviceCall.result) {
            return 'reconnect';
        }

        if (deviceCall.name === FIRMWARE_UPLOAD) {
            return 'installing';
        }

        if (deviceCall.name === FIRMWARE_ERASE) {
            return 'preparing';
        }

        if (fetchCall.name === GET_FIRMWARE) {
            return 'downloading';
        }

        if (device.firmware === 'none' || device.firmware === 'unknown') {
            return 'initial';
        }

        if (device.firmware === 'outdated') {
            return 'outdated';
        }
        return null;
    }

    getMessageForStatus = () => {
        const { device } = this.props;
        const status = this.getStatus();
        if (status === 'reconnect' && !device.connected && device.features.major_version === 1) {
            return this.props.intl.formatMessage(l10nMessages.TR_CONNECT_YOUR_DEVICE_AGAIN);
        }
        if (status === 'reconnect' && device.connected && device.features.major_version === 1) {
            return this.props.intl.formatMessage(l10nMessages.TR_DISCONNECT_YOUR_DEVICE);
        }
        if (status === 'reconnect' && device.features.major_version === 2) {
            return this.props.intl.formatMessage(l10nMessages.TR_WAIT_FOR_REBOOT);
        }
        return this.props.intl.formatMessage(l10nMessages.TR_INSTALLING);
    };

    install = async () => {
        this.props.firmwareUpdateActions.updateFirmware();
    };

    isProgress() {
        const status = this.getStatus();
        const targetStates = [
            'downloading',
            'preparing',
            'installing',
            'reconnect',
            'deviceCall-error',
            'fetchCall-error',
        ];
        return targetStates.includes(status);
    }

    render() {
        const { device, deviceCall, fetchCall, firmwareUpdate } = this.props;
        const isConnected = device && device.connected;

        return (
            <StepWrapper>
                <StepHeadingWrapper>
                    <FormattedMessage {...l10nMessages.TR_FIRMWARE_HEADING} />
                </StepHeadingWrapper>
                <StepBodyWrapper>
                    {this.getStatus() === 'initial' && (
                        <React.Fragment>
                            <Text>
                                <FormattedMessage {...l10nMessages.TR_FIRMWARE_SUBHEADING} />
                            </Text>
                            <ControlsWrapper>
                                <Button onClick={() => this.install()}>
                                    <FormattedMessage {...l10nMessages.TR_INSTALL} />
                                </Button>
                            </ControlsWrapper>
                        </React.Fragment>
                    )}

                    {this.getStatus() === 'outdated' && (
                        <React.Fragment>
                            <Text>
                                <FormattedMessage
                                    {...l10nMessages.TR_FIRMWARE_INSTALLED_TEXT}
                                    values={{
                                        version: `${device.features.major_version}.${
                                            device.features.minor_version
                                        }.${device.features.patch_version}`,
                                    }}
                                />
                            </Text>
                            <ControlsWrapper>
                                {isConnected && (
                                    <Button
                                        isDisabled={!isConnected}
                                        onClick={() => this.props.onboardingActions.goToNextStep()}
                                    >
                                        <FormattedMessage {...commonMessages.TR_CONTINUE} />
                                    </Button>
                                )}
                                {!isConnected && (
                                    <Tooltip
                                        placement="bottom"
                                        content="Connect device to continue"
                                    >
                                        <Button
                                            isDisabled={!isConnected}
                                            onClick={() =>
                                                this.props.onboardingActions.goToNextStep()
                                            }
                                        >
                                            <FormattedMessage {...commonMessages.TR_CONTINUE} />
                                        </Button>
                                    </Tooltip>
                                )}
                            </ControlsWrapper>
                        </React.Fragment>
                    )}

                    {this.isProgress() && (
                        <React.Fragment>
                            <Donut
                                progress={firmwareUpdate.progress}
                                radius={DONUT_RADIUS}
                                stroke={DONUT_STROKE}
                                isSuccess={this.getStatus() === 'success'}
                                isError={deviceCall.error !== null || fetchCall.error !== null}
                            />
                            {!deviceCall.error && !fetchCall.error && (
                                <React.Fragment>
                                    <P>
                                        {this.getMessageForStatus()}
                                        <Dots />
                                    </P>
                                    {this.getStatus() === 'reconnect' && (
                                        <ConnectDeviceIcon model={device.features.major_version} />
                                    )}
                                </React.Fragment>
                            )}
                            {(deviceCall.error || fetchCall.error) && (
                                <React.Fragment>
                                    {deviceCall.error && (
                                        <Text style={{ color: colors.error }}>
                                            <FormattedMessage
                                                {...l10nMessages.TR_INSTALL_ERROR_OCCURRED}
                                                values={{ error: deviceCall.error }}
                                            />
                                        </Text>
                                    )}
                                    {fetchCall.error && (
                                        <Text style={{ color: colors.error }}>
                                            <FormattedMessage
                                                {...l10nMessages.TR_FETCH_ERROR_OCCURRED}
                                                values={{ error: fetchCall.error }}
                                            />
                                        </Text>
                                    )}
                                    <ControlsWrapper>
                                        <Button onClick={() => this.install()}>
                                            <FormattedMessage {...commonMessages.TR_RETRY} />
                                        </Button>
                                    </ControlsWrapper>
                                </React.Fragment>
                            )}
                        </React.Fragment>
                    )}

                    {this.getStatus() === 'success' && (
                        <React.Fragment>
                            <Text>
                                <FormattedMessage {...l10nMessages.TR_FIRMWARE_INSTALLED} />
                            </Text>
                            <ControlsWrapper>
                                {isConnected && (
                                    <Button
                                        isDisabled={!isConnected}
                                        onClick={() => this.props.onboardingActions.goToNextStep()}
                                    >
                                        <FormattedMessage {...commonMessages.TR_CONTINUE} />
                                    </Button>
                                )}
                                {!isConnected && (
                                    <Tooltip
                                        placement="bottom"
                                        content="Connect device to continue"
                                    >
                                        <Button
                                            isDisabled={!isConnected}
                                            onClick={() =>
                                                this.props.onboardingActions.goToNextStep()
                                            }
                                        >
                                            <FormattedMessage {...commonMessages.TR_CONTINUE} />
                                        </Button>
                                    </Tooltip>
                                )}
                            </ControlsWrapper>
                        </React.Fragment>
                    )}
                </StepBodyWrapper>
            </StepWrapper>
        );
    }
}

export default injectIntl(FirmwareStep);
