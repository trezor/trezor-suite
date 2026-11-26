import styled from 'styled-components';

import { Image } from '@trezor/components';

import { EARN_PROVIDER_METADATA, type EarnProviderId } from './providerMetadata';

const ImageWrapper = styled.div`
    display: flex;
    filter: ${({ theme }) => (theme.variant === 'dark' ? 'invert(1)' : 'none')};
`;

type EarnProviderLogoProps = {
    provider: EarnProviderId;
    width?: number;
    height?: number;
};

export const EarnProviderLogo = ({ provider, width, height }: EarnProviderLogoProps) => (
    <ImageWrapper>
        <Image image={EARN_PROVIDER_METADATA[provider].logo} width={width} height={height} />
    </ImageWrapper>
);
