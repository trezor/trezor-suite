import { Button, Text, Tooltip } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import styled from 'styled-components';

const Notification = styled.div`
    display: flex;
    flex-direction: row;
    background-color: ${({ theme }) => theme.backgroundNeutralBold};
    position: relative;
    z-index: 1;
`;

const TextContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xs};
`;

// Todo: Translations

export const RememberWalletNotification = () => (
    <Tooltip
        content={
            <Notification>
                <TextContent>
                    <Text variant="primary">View-only enabled</Text>
                    <Text>You will see wallet balances after disconnecting Trezor</Text>
                    <Text variant="tertiary">You can change it here</Text>
                </TextContent>
                <Button>Got it</Button>
            </Notification>
        }
    >
        <span>yolo</span>
    </Tooltip>
);
