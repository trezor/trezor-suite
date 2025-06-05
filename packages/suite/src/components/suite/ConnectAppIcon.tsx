import styled from 'styled-components';

import { IconCircle } from '@trezor/components';
import { SpacingValues, spacings } from '@trezor/theme';

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
    const { loading, error, imageBlob } = useProxyImage(src);

    if (loading || error || !src || !imageBlob) {
        return (
            <IconCircle
                name={type === 'walletConnect' ? 'walletConnect' : 'plugs'}
                size={size}
                paddingType={size > spacings.xxl ? 'large' : 'small'}
                variant="tertiary"
                hasBorder={false}
            />
        );
    }

    return <AppIconImage src={imageBlob} alt="App Icon" size={size} />;
};
