import React, { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
// import { FormattedMessage } from 'react-intl';

import { Button, P, H1, H4, variables, Checkbox } from '@trezor/components';
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

const Checkboxes = styled.div`
    flex: 1;
`;

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
    // todo: this should go to reducer probably;
    const [isSeedCardChecked, setIsSeedCardChecked] = useState(false);
    const { device, firmware } = props;

    if (!device || device.type !== 'acquired') return null;
    // const getStatus = () => {
    //     if (!device || !device.connected) {
    //         return 'connect-device';
    //     }
    //     if (device.mode !== 'bootloader') {
    //         return 'switch-to-bootloader';
    //     }
    //     if (
    //         device.mode === 'bootloader' &&
    //         (device.firmware === 'outdated' || device.firmware === 'unknown')
    //     ) {
    //         return 'install-button';
    //     }
    // };

    // const isUpdateNeeded = () => {
    //     return ['none', 'outdated', 'required'].includes(device.firmware);
    // };

    const isUpdateAvailable = () => {
        return device.firmware !== 'valid';
    };

    const isInProgress = () => {
        if (!firmware.status) return null;
        return ['started', 'downloading', 'installing', 'restarting'].includes(firmware.status);
    };

    if (!device || !device.connected) {
        return (
            <Wrapper>
                {/* todo: use proper notifications */}
                <WalletNotifications />
                <Top>
                    <TitleHeader>Reconnect device to continue</TitleHeader>
                </Top>
            </Wrapper>
        );
    }

    if (!isUpdateAvailable()) {
        return (
            <Wrapper>
                <WalletNotifications />
                <Top>
                    <TitleHeader>Device has the latest firmware</TitleHeader>
                </Top>
                <Bottom>
                    <Button onClick={() => goto(getRoute('suite-index'))}>Go to wallet</Button>
                </Bottom>
            </Wrapper>
        );
    }

    if (device.mode !== 'bootloader') {
        return (
            <Wrapper>
                <WalletNotifications />
                <Top>
                    <TitleHeader>Firmware update</TitleHeader>
                </Top>

                <Middle>
                    <ChangeLog>
                        <H4>Changelog</H4>
                        <div>{device.firmwareRelease.version.join('.')}</div>
                        {device.firmwareRelease.changelog.split('*').map((row: string) => (
                            <div key={row.substr(0, 8)}>{row}</div>
                        ))}
                    </ChangeLog>
                </Middle>

                <Bottom>
                    <P>Switch device to bootloader to continue</P>
                </Bottom>
            </Wrapper>
        );
    }

    // const currentVersion = `${device.features.major_version}.${device.features.minor_version}.${device.features.patch_version}`;

    return (
        <Wrapper>
            <WalletNotifications />
            <Top>
                <TitleHeader>Firmware update</TitleHeader>
            </Top>

            <Middle>
                {isInProgress() && (
                    <div>
                        {firmware.status} <Dots />
                    </div>
                )}
                {!isInProgress() && firmware.error && (
                    <>
                        Failed to install firmware. Error: {firmware.error}
                        <Button onClick={() => props.firmwareUpdate()}>Retry</Button>
                    </>
                )}

                {!isInProgress() && device.firmware && (
                    <>
                        <Checkboxes>
                            <Checkbox
                                isChecked={isSeedCardChecked}
                                onClick={() => setIsSeedCardChecked(!isSeedCardChecked)}
                            >
                                I have my seed card
                            </Checkbox>
                        </Checkboxes>
                    </>
                )}
            </Middle>
            <Bottom>
                {!isInProgress() && (
                    <>
                        {firmware.error && (
                            <Button onClick={() => props.firmwareUpdate()}>Retry</Button>
                        )}

                        {!firmware.error && device.firmware !== 'valid' && (
                            <Button onClick={() => props.firmwareUpdate()}>Install</Button>
                        )}
                    </>
                )}
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
