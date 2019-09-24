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
`;

const ChangeLog = ({ firmwareRelease }: { firmwareRelease?: FirmwareRelease }) => {
    if (!firmwareRelease) {
        return null;
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
        return ['started', 'downloading', 'installing', 'restarting'].includes(firmware.status);
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

    const exitApp = () => {
        // todo: maybe in middleware?
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
        if (!hasDevice()) {
            return 'Reconnect device to continue';
        }
        if (hasNewestFirmware()) {
            return 'Device is up to date';
        }
        if (isUpdateAvailable() && !isInBootloader()) {
            return 'Switch to bootloader';
        }
        return 'Firmware update';
    };

    // todo: handle bootloader mode
    // todo: handle unacquired

    return (
        <Wrapper>
            <Top>
                <TitleHeader>{getTitle()}</TitleHeader>
            </Top>
            <Middle>
                {!isInProgress() && (
                    <>
                        {hasDevice() &&
                            !isInBootloader() &&
                            !hasNewestFirmware() &&
                            device &&
                            device.features && (
                                <ChangeLog firmwareRelease={device.firmwareRelease}></ChangeLog>
                            )}
                        <ConnectPrompt model={getModel() || 2} loop={!hasDevice()} />
                    </>
                )}
                {isInProgress() && (
                    <div>
                        {firmware.status} <Loaders.Dots />
                    </div>
                )}
            </Middle>
            <Bottom>
                {!isInProgress() && (
                    <>
                        <Button onClick={() => exitApp()}>{getExitButtonText()}</Button>
                        {isInBootloader() && hasDevice() && (
                            <Button onClick={() => props.firmwareUpdate()}>Install</Button>
                        )}
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
