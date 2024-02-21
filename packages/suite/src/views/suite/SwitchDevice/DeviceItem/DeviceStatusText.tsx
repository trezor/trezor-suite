import styled, { css, useTheme } from 'styled-components';
import { TrezorDevice } from '@suite-common/suite-types';
import * as deviceUtils from '@suite-common/suite-utils';
import { Icon, TOOLTIP_DELAY_LONG, TruncateWithTooltip } from '@trezor/components';
import { spacingsPx, typography } from '@trezor/theme';
import React, { MouseEventHandler } from 'react';
import { Translation, WalletLabeling, useGetWalletLabel } from 'src/components/suite';

const Container = styled.span<{ color: string; isAction?: boolean }>`
    ${typography.label}
    color: ${({ color }) => color};

    ${({ isAction }) =>
        isAction &&
        css`
            :hover {
                opacity: 0.8;
            }
        `}
`;
const TextRow = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xxs};
`;

type DeviceStatusTextProps = {
    device: TrezorDevice;
    onRefreshClick?: MouseEventHandler;
    walletLabel?: string;
};

export const DeviceStatusText = ({
    device,
    onRefreshClick,
    walletLabel,
}: DeviceStatusTextProps) => {
    const theme = useTheme();
    const { connected } = device;
    const deviceStatus = deviceUtils.getStatus(device);
    const needsAttention = deviceUtils.deviceNeedsAttention(deviceStatus);
    const isDeviceStatusVisible = Boolean(useGetWalletLabel({ device }));

    if (connected && needsAttention && onRefreshClick) {
        return (
            <Container isAction onClick={onRefreshClick} color={theme.textAlertYellow}>
                <TextRow>
                    <Icon icon="REFRESH" size={12} color={theme.textAlertYellow} />
                    <Translation id="TR_SOLVE_ISSUE" />
                </TextRow>
            </Container>
        );
    }

    return isDeviceStatusVisible ? (
        <Container
            color={connected ? theme.textPrimaryDefault : theme.textSubdued}
            data-test={connected ? '@deviceStatus-connected' : '@deviceStatus-disconnected'}
        >
            <TextRow>
                <Icon
                    icon={connected ? 'LINK' : 'UNLINK'}
                    size={12}
                    color={connected ? theme.iconPrimaryDefault : theme.textSubdued}
                />
                {walletLabel ? (
                    <TruncateWithTooltip delayShow={TOOLTIP_DELAY_LONG}>
                        <WalletLabeling device={device} />
                    </TruncateWithTooltip>
                ) : (
                    <Translation id={connected ? 'TR_CONNECTED' : 'TR_DISCONNECTED'} />
                )}
            </TextRow>
        </Container>
    ) : null;
};
