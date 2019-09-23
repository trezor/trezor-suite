import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
// import { FormattedMessage } from 'react-intl';

import { Button, P, H1, H4, H5, variables } from '@trezor/components';
import * as routerActions from '@suite-actions/routerActions';
import * as firmwareActions from '@suite-actions/firmwareActions';
import * as suiteActions from '@suite-actions/suiteActions';
// todo: now used in suite, refactor from onboarding
import WalletNotifications from '@wallet-components/Notifications';
import { Loaders } from '@onboarding-components';

// todo: rework to common notifications

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
    flex-direction: column;
    flex: 1;
`;

// todo warnings checkboxes
// const Checkboxes = styled.div`
//     flex: 1;
// `;

const ChangeLog = styled.div`
    flex: 1;
`;

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
});

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const FirmwareUpdate = (props: Props) => {
    const { device, firmware } = props;

    const leave = () => {
        props.lockRouter(false);
        props.goto('suite-index');
    };

    if (!device || !device.features) {
        return (
            <Wrapper>
                <Top>
                    <TitleHeader>Firmware update</TitleHeader>
                </Top>
                <Middle>Connect your device to continue</Middle>
                <Bottom>
                    <Button onClick={() => leave()}>Go to wallet</Button>
                </Bottom>
            </Wrapper>
        );
    }

    const isInProgress = () => {
        if (!firmware || !firmware.status) return null;
        return ['started', 'downloading', 'installing', 'restarting'].includes(firmware.status);
    };

    const getStatus = () => {
        if (!device || !device.connected) {
            return 'no-device';
        }
        if (isInProgress()) {
            return 'in-progress';
        }
        if (device.mode === 'bootloader') {
            return 'in-bl';
        }
        if (device.firmware === 'valid') {
            return 'up-to-date';
        }
        if (['outdated', 'required'].includes(device.firmware)) {
            return 'update-available';
        }
    };

    const getTitleForStatus = () => {
        switch (getStatus()) {
            case 'no-device':
                return 'Reconnect device to continue';
            case 'up-to-date':
                return 'Device is up to date';
            default:
                return 'Firmware update';
        }
    };

    // todo: handle bootloader mode
    // todo: handle unacquired

    return (
        <Wrapper>
            {/* todo: use proper notifications, leaving it here as a starting point for next iteration */}
            <WalletNotifications />
            <Top>
                {getStatus()}
                <TitleHeader>{getTitleForStatus()}</TitleHeader>
            </Top>

            <Middle>
                {getStatus() === 'update-available' &&
                    // checking device.firmwareRelase because of typescript. better way how to do it?
                    device.firmwareRelease && (
                        <ChangeLog>
                            <H4>Changelog</H4>
                            <H5>{device.firmwareRelease.version.join('.')}</H5>
                            {device.firmwareRelease.changelog.split('*').map((row: string) => (
                                <P key={row.substr(0, 8)}>{row}</P>
                            ))}
                        </ChangeLog>
                    )}
                {getStatus() === 'in-progress' && (
                    <div>
                        {firmware.status}
                        <Loaders.Dots />
                    </div>
                )}
            </Middle>

            <Bottom>
                {getStatus() === 'up-to-date' && (
                    <Button onClick={() => leave()}>Go to wallet</Button>
                )}
                {getStatus() === 'update-available' && (
                    <P>Switch device to bootloader to continue</P>
                )}
                {getStatus() === 'in-bl' && (
                    <Button onClick={() => props.firmwareUpdate()}>Install</Button>
                )}
                {/* button just for debugging */}
                <Button onClick={() => leave()}>Go to wallet</Button>
            </Bottom>
        </Wrapper>
    );
};

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(FirmwareUpdate);
