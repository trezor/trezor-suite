import * as React from 'react';
import styled from 'styled-components';
import { isDesktop } from '@suite-utils/env';
import { useSelector } from '@suite-hooks';

import OnlineStatus from './OnlineStatus';
import UpdateBridge from './UpdateBridge';
import UpdateFirmware from './UpdateFirmware';
import NoBackup from './NoBackup';
import FailedBackup from './FailedBackup';
import MessageSystemBanner from './MessageSystemBanner';
import { Notification } from '@suite/types/suite/messageSystem';

const Wrapper = styled.div`
    z-index: 3;
    background: ${props => props.theme.BG_WHITE};
`;

const Banners = () => {
    const transport = useSelector(state => state.suite.transport);
    const online = useSelector(state => state.suite.online);
    const device = useSelector(state => state.suite.device);
    const { compatibleNotifications, dismissedNotifications, config } = useSelector(
        state => state.messageSystem,
    );

    const showUpdateBridge = () => {
        if (
            isDesktop() &&
            transport?.version &&
            ['2.0.27', '2.0.28', '2.0.29'].includes(transport.version)
        ) {
            return false;
        }
        return transport?.outdated;
    };

    const getMessageSystemBanner = (): Notification | null => {
        const availableNotifications = compatibleNotifications.banner.filter(
            id => !dismissedNotifications[id]?.banner,
        );

        const notifications = config?.actions
            .filter(({ notification }) => availableNotifications.includes(notification.id))
            .map(action => action.notification);

        if (!notifications?.length) return null;

        return notifications.reduce((prev, current) =>
            prev.priority > current.priority ? prev : current,
        );
    };

    let banner;
    let priority = 0;
    if (device?.features?.unfinished_backup) {
        banner = <FailedBackup />;
        priority = 9;
    } else if (device?.features?.needs_backup) {
        banner = <NoBackup />;
        priority = 7;
    } else if (showUpdateBridge()) {
        banner = <UpdateBridge />;
        priority = 5;
    } else if (
        device?.connected &&
        device?.features &&
        device?.mode !== 'bootloader' &&
        ['outdated'].includes(device.firmware)
    ) {
        banner = <UpdateFirmware />;
        priority = 3;
    }

    const messageSystemBanner = getMessageSystemBanner();
    if (messageSystemBanner && messageSystemBanner.priority >= priority) {
        banner = <MessageSystemBanner notification={messageSystemBanner} />;
    }

    return (
        <Wrapper>
            <OnlineStatus isOnline={online} />
            {banner}
            {/* TODO: add Pin not set */}
        </Wrapper>
    );
};

export default Banners;
