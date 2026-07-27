import styled from 'styled-components';

import { IconCircle } from '@trezor/components';
import { PlugsIcon, WalletConnectIcon } from '@trezor/icons';
import { type SpacingValue } from '@trezor/theme';

import { useProxyImage } from 'src/hooks/suite/useProxyImage';

const AppIconImage = styled.img<{ size: SpacingValue }>`
    width: ${({ size }) => size}px;
    height: ${({ size }) => size}px;
    border-radius: ${({ size }) => size / 2}px;
    background: ${({ theme }) => theme.elementFillNeutralSoft};
`;

export const ConnectAppIcon = ({
    src,
    type,
    size = 32,
}: {
    src?: string;
    type?: 'walletConnect' | 'trezorConnect';
    size?: SpacingValue;
}) => {
    const proxyImageQuery = useProxyImage(src);

    if (!proxyImageQuery.isSuccess) {
        let iconCircleSize: 24 | 32 | 40;
        if (size <= 22) {
            iconCircleSize = 24;
        } else if (size <= 36) {
            iconCircleSize = 32;
        } else {
            iconCircleSize = 40;
        }

        return (
            <IconCircle
                icon={type === 'walletConnect' ? WalletConnectIcon : PlugsIcon}
                size={iconCircleSize}
                intent="neutral"
            />
        );
    }

    return <AppIconImage src={proxyImageQuery.data} alt="App Icon" size={size} />;
};
