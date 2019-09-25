import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
// import { FormattedMessage } from 'react-intl';
import { FirmwareRelease } from 'trezor-connect';
import { Button, P, H1, H4, H5, variables } from '@trezor/components';
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
    padding-top: 30px;
`;

const Middle = styled.div`
    display: flex;
    flex: 1;
    text-align: center;
`;

const Bottom = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    width: 100%;
`;

// todo warnings checkboxes
// const Checkboxes = styled.div`
//     flex: 1;
// `;

const ChangelogWrapper = styled.div`
    flex: 1;
    padding: 17px 20px 0 20px;
`;

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
        // if (!hasDevice()) {
        //     return 'Reconnect device to continue';
        // }
        if (hasNewestFirmware()) {
            return 'Device is up to date';
        }
        if (isUpdateAvailable() && !isInBootloader()) {
            return 'Switch to bootloader';
        }
        return 'Firmware update';
    };

    const isInstallButtonDisabled = () => {
        return !hasDevice() || !isInBootloader();
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
        <Wrapper>
            <Top>
                <TitleHeader>{getTitle()}</TitleHeader>
            </Top>
            <Middle>
                <ConnectPrompt model={getModelForPrompt()} loop={!hasDevice()} />

                {firmware.status === 'initial' && (
                    <>
                        <ChangeLog
                            isLatest={hasNewestFirmware()}
                            firmwareRelease={getFirmwareRelease()}
                            currentVersion={getFwVersion()}
                        ></ChangeLog>
                    </>
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
                        {firmware.error && <P>{firmware.error}</P>}
                    </div>
                )}
            </Middle>
            <Bottom>
                {firmware.status === 'initial' && (
                    <>
                        <Button isInverse onClick={() => exitApp()}>
                            {getExitButtonText()}
                        </Button>
                        <Button
                            onClick={() => props.firmwareUpdate()}
                            isDisabled={isInstallButtonDisabled()}
                        >
                            Install
                        </Button>
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
                        <Button
                            onClick={() => props.firmwareUpdate()}
                            isDisabled={isInstallButtonDisabled()}
                        >
                            Retry
                        </Button>
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
