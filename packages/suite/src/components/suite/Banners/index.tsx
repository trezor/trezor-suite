import * as React from 'react';
import styled from 'styled-components';
import { isDesktop } from '@suite-utils/env';
import { useSelector } from '@suite-hooks';

import OnlineStatus from './OnlineStatus';
import UpdateBridge from './UpdateBridge';
import UpdateFirmware from './UpdateFirmware';
import NoBackup from './NoBackup';
import FailedBackup from './FailedBackup';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    z-index: 3;
`;

const Banners = () => {
    const transport = useSelector(state => state.suite.transport);
    const online = useSelector(state => state.suite.online);
    const device = useSelector(state => state.suite.device);

    let Banner;

    const showUpdateBridge = () => {
        if (
            isDesktop() &&
            transport &&
            transport.version &&
            ['2.0.27', '2.0.28', '2.0.29'].includes(transport.version)
        ) {
            return false;
        }
        return transport?.outdated;
    };

    if (device?.features?.unfinished_backup) {
        Banner = <FailedBackup />;
    } else if (device?.features?.needs_backup) {
        Banner = <NoBackup />;
    } else if (showUpdateBridge()) {
        Banner = <UpdateBridge />;
    } else if (
        device?.connected &&
        device?.features &&
        device?.mode !== 'bootloader' &&
        ['outdated'].includes(device.firmware)
    ) {
        Banner = <UpdateFirmware />;
    }

    return (
        <Wrapper>
            <OnlineStatus isOnline={online} />
            {Banner}
            {/* TODO: add Pin not set */}
        </Wrapper>
    );
};

export default Banners;
