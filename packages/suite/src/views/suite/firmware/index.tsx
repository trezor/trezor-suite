import React, { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
// import { FormattedMessage } from 'react-intl';
import { FirmwareRelease } from 'trezor-connect';
import { Button, Checkbox, Tooltip, P, H1, H4, H5, variables } from '@trezor/components';
import * as routerActions from '@suite-actions/routerActions';
import * as firmwareActions from '@suite-actions/firmwareActions';
import * as suiteActions from '@suite-actions/suiteActions';

import { ConnectPrompt } from '@suite-components/Prompts';

// todo move to suite components;
import { Loaders } from '@onboarding-components';

import { AppState, Dispatch } from '@suite-types';
// import l10nMessages from './index.messages';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 24px 30px 24px;
    flex: 1;
    width: 100%;
`;

const Top = styled.div`
    display: flex;
    flex-direction: column;
    max-width: 500px;
    text-align: center;
    flex: 1;
`;

const Middle = styled.div`
    display: flex;
    flex: 1;
    text-align: center;
`;

const MiddleLeft = styled.div`
    display: none;
    @media only screen and (min-width: ${variables.SCREEN_SIZE.SM}) {
        display: flex;
        flex: 1;
    }
`;

const MiddleRight = styled.div`
    flex: 1;
`;

const Bottom = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    & > * {
        align-self: flex-start;
    }
    @media only screen and (min-width: ${variables.SCREEN_SIZE.SM}) {
        justify-content: space-around;
    }
`;

const Checkboxes = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    margin-top: 10px;
    & > * {
        padding: 5px 0 5px 0;
    }
`;

const ChangelogWrapper = styled.div`
    /* padding: 17px 20px 0 20px; */
    text-align: left;
`;

// todo: consider sharing between firmware and onboarding
interface ButtonProps {
    onClick: () => void;
    isConnected: boolean;
    isInBootloader: boolean;
    userUnderstands: boolean;
    children: React.ReactNode;
}

const InstallButton = ({
    isConnected,
    isInBootloader,
    userUnderstands,
    onClick,
    ...props
}: ButtonProps) => {
    let content = '';
    if (!isConnected) {
        content = 'Connect device to continue';
    } else if (!isInBootloader) {
        content = 'Go to bootloader';
    } else if (!userUnderstands) {
        content = 'Make sure you have either correct seed or your device is empty';
    }

    const isDisabled = !isConnected || !isInBootloader || !userUnderstands;
    return (
        <Tooltip
            trigger={!isDisabled ? 'manual' : 'mouseenter focus'}
            placement="bottom"
            content={content}
        >
            <Button isDisabled={isDisabled} onClick={() => onClick()}>
                {props.children}
            </Button>
        </Tooltip>
    );
};

const ChangeLog = ({
    firmwareRelease,
    isLatest,
    currentVersion,
}: {
    firmwareRelease?: FirmwareRelease;
    isLatest?: boolean;
    currentVersion?: string;
}) => {
    if (isLatest) {
        return (
            <ChangelogWrapper>
                <H4>{currentVersion}</H4>
                <P>Latest firmware already installed</P>
            </ChangelogWrapper>
        );
    }
    if (!firmwareRelease) {
        return (
            <ChangelogWrapper>
                <H4>Changelog</H4>
                <P>Connect your device to see changelog</P>
            </ChangelogWrapper>
        );
    }
    return (
        <ChangelogWrapper>
            <H4>Changelog</H4>
            <H5>{firmwareRelease.version.join('.')}</H5>
            {firmwareRelease.changelog.split('*').map((row: string) => (
                <P key={row.substr(0, 8)}>{row}</P>
            ))}
        </ChangelogWrapper>
    );
};

const TitleHeader = styled(H1)`
    display: flex;
    font-size: ${variables.FONT_SIZE.HUGE};
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
`;

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    firmware: state.firmware,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
    firmwareUpdate: bindActionCreators(firmwareActions.firmwareUpdate, dispatch),
    lockRouter: bindActionCreators(suiteActions.lockRouter, dispatch),
    exitApp: bindActionCreators(suiteActions.exitApp, dispatch),
});

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const FirmwareUpdate = (props: Props) => {
    const { device, firmware } = props;

    // todo:
    // this belongs to reducer, but until we have proper UX design, I am just mocking it here,
    // with local state. Dont want rewrite reducers/actions/types/tests and everything later.
    const [hasEmptyDevice, setHasEmptyDevice] = useState(false);
    const [hasSeedByHand, setHasSeedByHand] = useState(false);

    const isInProgress = () => {
        return [
            'started',
            'downloading',
            'waiting-for-confirmation',
            'installing',
            'restarting',
        ].includes(firmware.status);
    };

    const isInFinishedState = () => {
        return ['error', 'done'].includes(firmware.status);
    };

    const hasDevice = () => {
        return !!(device && device.features && device.connected);
    };

    const isInBootloader = () => {
        return !!(device && device.features && device.mode === 'bootloader');
    };

    const hasNewestFirmware = () => {
        return !!(device && device.features && device.firmware === 'valid');
    };

    const isUpdateAvailable = () => {
        return device && device.features && ['outdated', 'required'].includes(device.firmware);
    };

    const getModel = () => {
        return device && device.features && device.features.major_version;
    };

    const getFwVersion = () => {
        return (
            device &&
            device.features &&
            `${device.features.major_version}.${device.features.minor_version}.${device.features.patch_version}`
        );
    };

    const getModelForPrompt = () => {
        return (
            getModel() ||
            (firmware.device &&
                firmware.device.features &&
                firmware.device.features.major_version) ||
            2
        );
    };

    const exitApp = () => {
        if (device && device.features && device.mode === 'initialize') {
            return props.exitApp('onboarding-index');
        }
        return props.exitApp('suite-index');
    };

    const getExitButtonText = () => {
        if (device && device.features && device.mode === 'initialize') {
            return 'Continue to setup';
        }
        return 'Go to wallet';
    };

    const getTitle = () => {
        if (firmware.status === 'error') {
            return 'Firmware update failed';
        }
        if (firmware.status === 'restarting') {
            return 'Waiting for device to restart';
        }
        if (hasNewestFirmware()) {
            return 'Device is up to date';
        }
        if (isUpdateAvailable() && !isInBootloader()) {
            return 'Switch to bootloader';
        }
        return 'Firmware update';
    };

    const userUnderstandsWarning = () => {
        return hasSeedByHand || hasEmptyDevice;
    };

    const getFirmwareRelease = () => {
        // currently selected device has latest firmware
        if (device && device.features && device.firmware === 'valid') {
            return;
        }
        if (device && device.features && device.firmwareRelease) {
            return device.firmwareRelease;
        }
        if (firmware.device && firmware.device.features && firmware.device.firmwareRelease) {
            return firmware.device.firmwareRelease;
        }
    };

    // todo: handle bootloader mode
    // todo: handle unacquired

    return (
        <Wrapper data-test="firmware-static-page">
            <Top>
                <TitleHeader>{getTitle()}</TitleHeader>
                {!isInBootloader() && <P>Reconnect in bootloader mode to update firmware</P>}
            </Top>
            <Middle>
                <MiddleLeft>
                    <ConnectPrompt model={getModelForPrompt()} loop={!hasDevice()} />
                </MiddleLeft>
                <MiddleRight>
                    {firmware.status === 'initial' && (
                        <ChangeLog
                            isLatest={hasNewestFirmware()}
                            firmwareRelease={getFirmwareRelease()}
                            currentVersion={getFwVersion()}
                        ></ChangeLog>
                    )}
                    {(isInProgress() || isInFinishedState()) && (
                        <div>
                            <Loaders.Donut
                                progress={firmware.installingProgress}
                                isSuccess={firmware.status === 'done'}
                                isError={firmware.status === 'error'}
                            />
                            {!isInFinishedState() && (
                                <P>
                                    {firmware.status}
                                    <Loaders.Dots />
                                </P>
                            )}
                            {/* todo: firmware.error.error ? */}
                            {/* {firmware.error && <P>{firmware.error}</P>} */}
                            {firmware.error && <P>Error</P>}
                        </div>
                    )}
                    {firmware.status === 'initial' && hasDevice() && !hasNewestFirmware() && (
                        <Checkboxes>
                            <Checkbox
                                isChecked={hasSeedByHand}
                                onClick={() => setHasSeedByHand(!hasSeedByHand)}
                            >
                                <P>I have my seed</P>
                            </Checkbox>
                            <Checkbox
                                isChecked={hasEmptyDevice}
                                onClick={() => setHasEmptyDevice(!hasEmptyDevice)}
                            >
                                <P>My Trezor is empty</P>
                            </Checkbox>
                        </Checkboxes>
                    )}
                </MiddleRight>
            </Middle>

            <Bottom>
                {firmware.status === 'initial' && (
                    <>
                        <Button isInverse onClick={() => exitApp()}>
                            {getExitButtonText()}
                        </Button>
                        <InstallButton
                            isConnected={hasDevice()}
                            isInBootloader={isInBootloader()}
                            userUnderstands={userUnderstandsWarning()}
                            onClick={() => props.firmwareUpdate()}
                        >
                            {/* <FormattedMessage {...l10nMessages.TR_INSTALL} /> */}
                            {!isInBootloader() && hasNewestFirmware() ? 'Reinstall' : 'Install'}
                        </InstallButton>
                    </>
                )}
                {firmware.status === 'done' && (
                    <>
                        <Button onClick={() => exitApp()}>{getExitButtonText()}</Button>
                    </>
                )}
                {firmware.status === 'error' && (
                    <>
                        <Button isInverse onClick={() => exitApp()}>
                            {getExitButtonText()}
                        </Button>
                        <InstallButton
                            isConnected={hasDevice()}
                            isInBootloader={isInBootloader()}
                            userUnderstands={userUnderstandsWarning()}
                            onClick={() => props.firmwareUpdate()}
                        >
                            Retry
                        </InstallButton>
                    </>
                )}
            </Bottom>
        </Wrapper>
    );
};

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(FirmwareUpdate);
