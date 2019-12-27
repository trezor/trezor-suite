import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { FirmwareRelease } from 'trezor-connect';
import { Loaders } from '@onboarding-components';
import * as routerActions from '@suite-actions/routerActions';
import * as firmwareActions from '@suite-actions/firmwareActions';
import { ConnectPrompt } from '@suite-components/Prompts';
import { AppState, Dispatch } from '@suite-types';
import { Checkbox, Tooltip, variables } from '@trezor/components';
import { Button, H1, H2, P } from '@trezor/components-v2';

import {
    ChangeLog,
    Numbers,
    SeedConfirmScreen,
    ReconnectBootloaderScreen,
    ConfirmConnectScreen,
} from '@suite-components/FirmwareUpdate/components';

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    firmware: state.firmware,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    firmwareUpdate: bindActionCreators(firmwareActions.firmwareUpdate, dispatch),
    goto: bindActionCreators(routerActions.goto, dispatch),
});

const Wrapper = styled.div`
    display: flex;
    height: 100%;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
`;

type Props = ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps> & {
        showChangelog: boolean;
    };

const FirmwareUpdate = (props: Props) => {
    const { device, firmware, goto } = props;

    const getScreen = () => {
        if (!firmware.userConfirmedSeed) return 'seed-confirm-screen';
        if (device && device.mode !== 'bootloader') return 'reconnect-bootloader';
        if (!device) return 'confirm-connect';
        // if (device && device.mode === 'bootloader') return 'confirm-connect';
    };

    return (
        <Wrapper>
            hm?
            <Numbers length={3} />
            {getScreen() === 'seed-confirm-screen' && <SeedConfirmScreen />}
            {getScreen() === 'reconnect-bootloader' && <ReconnectBootloaderScreen />}
            {getScreen() === 'confirm-connect' && <ConfirmConnectScreen />}
            <Button onClick={() => goto('settings-device')}>Exit</Button>
        </Wrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(FirmwareUpdate);
