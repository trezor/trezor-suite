import React from 'react';
import styled from 'styled-components';
import { Translation, TroubleshootingTips } from '@suite-components';
import {
    TROUBLESHOOTING_TIP_BRIDGE_STATUS,
    TROUBLESHOOTING_TIP_BRIDGE_INSTALL,
} from '@suite-components/TroubleshootingTips/tips';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

// We don't really know what happened, show some generic help and provide link to contact a support
const DeviceUnreadable = () => (
    <Wrapper>
        <TroubleshootingTips
            label={<Translation id="TR_YOUR_DEVICE_IS_CONNECTED_BUT_UNREADABLE" />}
            items={[TROUBLESHOOTING_TIP_BRIDGE_STATUS, TROUBLESHOOTING_TIP_BRIDGE_INSTALL]}
            offerWebUsb
        />
    </Wrapper>
);

export default DeviceUnreadable;
