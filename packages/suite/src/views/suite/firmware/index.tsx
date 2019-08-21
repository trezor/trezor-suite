import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
// import { FormattedMessage } from 'react-intl';

import { Button, P, H1, H4, H5, variables } from '@trezor/components';
import { goto } from '@suite-actions/routerActions';
import { getRoute } from '@suite/utils/suite/router';
import { firmwareUpdate } from '@suite-actions/firmwareActions';
import { Dots } from '@suite/components/onboarding/Loaders';

// todo: rework to common notifications
import WalletNotifications from '@wallet-components/Notifications';

import { AppState } from '@suite-types';
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

interface Props {
    firmware: AppState['firmware'];
    device: AppState['suite']['device'];
    firmwareUpdate: typeof firmwareUpdate;
    goto: typeof goto;
}

const FirmwareUpdate = (props: Props) => {
    const { device, firmware } = props;

    if (!device || device.type !== 'acquired') return null;

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

    return (
        <Wrapper>
            {/* todo: use proper notifications, leaving it here as a starting point for next iteration */}
            <WalletNotifications />
            <Top>
                <TitleHeader>
                    {/* todo: this does not appear right now, it displays ConnectDevice page. */}
                    {getStatus() === 'no-device'
                        ? 'Reconnect device to continue'
                        : getStatus() === 'update-available'
                        ? 'Firmware update'
                        : getStatus() === 'up-to-date'
                        ? 'Device has the latest firmware'
                        : 'Firmware update'}
                </TitleHeader>
            </Top>

            <Middle>
                {getStatus() === 'update-available' && device.firmwareRelease ? (
                    <ChangeLog>
                        <H4>Changelog</H4>
                        <H5>{device.firmwareRelease.version.join('.')}</H5>
                        {device.firmwareRelease.changelog.split('*').map((row: string) => (
                            <P key={row.substr(0, 8)}>{row}</P>
                        ))}
                    </ChangeLog>
                ) : getStatus() === 'in-progress' ? (
                    <div>
                        {firmware.status}
                        <Dots />
                    </div>
                ) : null}
            </Middle>

            <Bottom>
                {getStatus() === 'up-to-date' ? (
                    <Button onClick={() => goto(getRoute('suite-index'))}>Go to wallet</Button>
                ) : getStatus() === 'update-available' ? (
                    <P>Switch device to bootloader to continue</P>
                ) : getStatus() === 'in-bl' ? (
                    <Button onClick={() => props.firmwareUpdate()}>Install</Button>
                ) : null}
            </Bottom>
        </Wrapper>
    );
};

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    firmware: state.firmware,
});

export default connect(
    mapStateToProps,
    dispatch => ({
        goto: bindActionCreators(goto, dispatch),
        firmwareUpdate: bindActionCreators(firmwareUpdate, dispatch),
    }),
)(FirmwareUpdate);
