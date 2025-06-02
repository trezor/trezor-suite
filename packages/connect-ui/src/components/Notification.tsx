import { useState } from 'react';

import styled from 'styled-components';

import { Button, Icon } from '@trezor/components';
import { SUITE_BRIDGE_DEEPLINK } from '@trezor/urls';

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

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledButton = styled(Button)`
    width: 100%;
    border: 1px solid #eb8a00;
    background-color: transparent;
    text-align: center;
    color: #eb8a00;
    transition: all 0.15s;

    &:active,
    &:focus,
    &:hover {
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
                <Icon name="info" color="#eb8a00" size={20} />
            </NotificationLeftCol>
            <NotificationRightCol>
                <NotificationHeader>
                    {header}
                    <Icon name="x" color="#eb8a00" onClick={() => setHidden(true)} />
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

export const UseSuiteDesktopNotification = () => (
    <Notification
        variant="warning"
        header="Try something new"
        body="Switch to Trezor Suite desktop for the best experience."
        cta={{ desc: 'Try Trezor Suite', url: SUITE_BRIDGE_DEEPLINK }}
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
