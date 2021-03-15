import * as React from 'react';
import styled from 'styled-components';

import { isDesktop } from '@suite-utils/env';
import { useSelector } from '@suite-hooks';
import { Message } from '@suite/types/suite/messageSystem';
import OnlineStatus from './OnlineStatus';
import UpdateBridge from './UpdateBridge';
import UpdateFirmware from './UpdateFirmware';
import NoBackup from './NoBackup';
import FailedBackup from './FailedBackup';
import MessageSystemBanner from './MessageSystemBanner';

const Wrapper = styled.div`
    z-index: 3;
    background: ${props => props.theme.BG_WHITE};
`;

const Banners = () => {
    const transport = useSelector(state => state.suite.transport);
    const online = useSelector(state => state.suite.online);
    const device = useSelector(state => state.suite.device);
    const { validMessages, dismissedMessages, config } = useSelector(state => state.messageSystem);

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

    const getMessageSystemBanner = (): Message | null => {
        const nonDismissedValidMessages = validMessages.banner.filter(
            id => !dismissedMessages[id]?.banner,
        );

        const messages = config?.actions
            .filter(({ message }) => nonDismissedValidMessages.includes(message.id))
            .map(action => action.message);

        if (!messages?.length) return null;

        return messages.reduce((prev, current) =>
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
        banner = <MessageSystemBanner message={messageSystemBanner} />;
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
