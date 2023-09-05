import { useState } from 'react';

import styled from 'styled-components';

import { Icon, Button } from '@trezor/components';
import { SUITE_FIRMWARE_URL, SUITE_BRIDGE_URL, SUITE_BACKUP_URL } from '@trezor/urls';

const NotificationBox = styled.div`
    background-color: ${({ color }) => color};
    padding: 16px;
    display: flex;
    flex-direction: row;
`;

const NotificationLeftCol = styled.div`
    padding-right: 8px;
`;

const NotificationRightCol = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
`;

const NotificationHeader = styled.div`
    margin-bottom: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    font-weight: 600;
    font-size: 14px;
    color: #eb8a00;
`;

const NotificationBody = styled.div`
    font-weight: 300;
    font-size: 14px;
    color: #eb8a00;
`;

const NotificationCta = styled.div`
    padding-top: 8px;
`;

const StyledButton = styled(Button)`
    width: 100%;
    border: 1px solid #eb8a00;
    background-color: transparent;
    text-align: center;
    color: #eb8a00;
    transition: all 0.15s;

    :hover {
        background-color: #eb8a00;
        color: #ffefd9;
    }

    :active {
        background-color: #eb8a00;
        color: #ffefd9;
    }

    :focus {
        background-color: #eb8a00;
        color: #ffefd9;
    }
`;

interface NotificationProps {
    header: string;
    body: string;
    variant: 'warning' | 'danger';
    cta?: {
        desc: string;
        url: string;
    };
}

const Notification = ({ header, body, cta, variant }: NotificationProps) => {
    const [hidden, setHidden] = useState(false);

    if (hidden) {
        return null;
    }

    // todo: find some nice red colors
    const color = variant === 'warning' ? '#ffefd9' : '#ffefd9';

    return (
        <NotificationBox color={color}>
            <NotificationLeftCol>
                <Icon icon="INFO" color="#eb8a00" size={20} />
            </NotificationLeftCol>
            <NotificationRightCol>
                <NotificationHeader>
                    {header}
                    <Icon icon="CROSS" color="#eb8a00" onClick={() => setHidden(true)} />
                </NotificationHeader>
                <NotificationBody>
                    <div>{body}</div>
                </NotificationBody>
                {cta && (
                    <NotificationCta>
                        <StyledButton
                            onClick={() => {
                                window.open(cta.url);
                                window.close();
                            }}
                        >
                            {cta.desc}
                        </StyledButton>
                    </NotificationCta>
                )}
            </NotificationRightCol>
        </NotificationBox>
    );
};

export const FirmwareUpdateNotification = () => (
    <Notification
        variant="warning"
        header="New firmware update available"
        body="A new firmware update is available for your Trezor device. Update now
for the latest features."
        cta={{ desc: 'Update my firmware', url: SUITE_FIRMWARE_URL }}
    />
);

export const BackupNotification = () => (
    <Notification
        variant="warning"
        header="Your Trezor is not backed up"
        body=""
        cta={{
            desc: 'Create a backup in 3 minutes',
            url: SUITE_BACKUP_URL,
        }}
    />
);

export const BridgeUpdateNotification = () => (
    <Notification
        variant="warning"
        header="New bridge is available"
        body=""
        cta={{ desc: 'Update bridge', url: SUITE_BRIDGE_URL }}
    />
);

export const SuspiciousOriginNotification = () => (
    <Notification
        variant="danger"
        header="Danger"
        body="You are interacting with a suspicious 3rd party application. If you continue your coins might be in danger. Proceed at your own risk"
        // cta={{
        //     desc: 'Learn more',
        //     url: 'todo: some explanation to trezor-wiki about phishing would be useful',
        // }}
    />
);
