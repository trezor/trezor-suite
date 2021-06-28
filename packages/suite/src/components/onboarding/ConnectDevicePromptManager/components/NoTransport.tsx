import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components/Translation';
import { TroubleshootingTips } from '@suite-components';
import {
    TROUBLESHOOTING_TIP_BRIDGE_STATUS,
    TROUBLESHOOTING_TIP_BRIDGE_INSTALL,
    TROUBLESHOOTING_TIP_UDEV,
    TROUBLESHOOTING_TIP_RESTART_COMPUTER,
} from '@suite-components/TroubleshootingTips/tips';

const Wrapper = styled.div`
    display: flex;
`;

const NoTransport = () => (
    // No transport layer (bridge/webUSB) is available
    // On web it makes sense to offer downloading Trezor Bridge
    // Desktop app should have Bridge transport layer available as it is built-in, if it is not available we fucked up something.
    <Wrapper>
        <TroubleshootingTips
            label={<Translation id="TR_TREZOR_BRIDGE_IS_NOT_RUNNING" />}
            items={[
                TROUBLESHOOTING_TIP_BRIDGE_STATUS,
                TROUBLESHOOTING_TIP_BRIDGE_INSTALL,
                TROUBLESHOOTING_TIP_UDEV,
                TROUBLESHOOTING_TIP_RESTART_COMPUTER,
            ]}
        />
    </Wrapper>
);
export default NoTransport;
