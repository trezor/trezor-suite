import styled, { useTheme } from 'styled-components';
import { TrezorDevice } from '@suite-common/suite-types';
import { Icon } from '@trezor/components';
import { spacingsPx, typography } from '@trezor/theme';
import React from 'react';
import { Translation, WalletLabeling } from 'src/components/suite';

const Container = styled.span<{ color: string }>`
    ${typography.label}
    color: ${({ color }) => color};
`;
const TextRow = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xxs};
`;

type DeviceStatusTextProps = { device: TrezorDevice; walletLabel?: string };

export const DeviceStatusText = ({ device, walletLabel }: DeviceStatusTextProps) => {
    const theme = useTheme();
    const { connected } = device;
    return (
        <Container
            color={connected ? theme.textPrimaryDefault : theme.textSubdued}
            data-test={connected ? '@deviceStatus-connected' : '@deviceStatus-disconnected'}
        >
            <TextRow>
                <Icon
                    icon={connected ? 'LINK' : 'UNLINK'}
                    size={12}
                    color={connected ? theme.iconPrimaryDefault : theme.iconPrimaryDefault}
                />
                {walletLabel ? (
                    <WalletLabeling device={device} />
                ) : (
                    <Translation id={connected ? 'TR_CONNECTED' : 'TR_DISCONNECTED'} />
                )}
            </TextRow>
        </Container>
    );
};
