import styled from 'styled-components';

import { IconCircle } from '@trezor/components';
import { type SpacingValues, spacings } from '@trezor/theme';

import { useProxyImage } from 'src/hooks/suite/useProxyImage';

const AppIconImage = styled.img<{ size: SpacingValues }>`
    width: ${({ size }) => size}px;
    height: ${({ size }) => size}px;
    border-radius: ${({ size }) => size / 2}px;
    background: ${({ theme }) => theme.backgroundNeutralSubtleOnElevation1};
`;

export const ConnectAppIcon = ({
    src,
    type,
    size = spacings.xxl,
}: {
    src?: string;
    type?: 'walletConnect' | 'trezorConnect';
    size?: SpacingValues;
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
                name={type === 'walletConnect' ? 'walletConnect' : 'plugs'}
                size={iconCircleSize}
                intent="neutral"
            />
        );
    }

    return <AppIconImage src={proxyImageQuery.data} alt="App Icon" size={size} />;
};
