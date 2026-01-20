import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { Image, ImageType, Row, Text } from '@trezor/components';

const PROVIDERS = {
    everstake: {
        logo: 'EVERSTAKE_LOGO',
    },
} as const satisfies Record<string, { logo: ImageType }>;

const ImageWrapper = styled.div`
    filter: ${({ theme }) => (theme.variant === 'dark' ? 'invert(1)' : 'none')};
`;

interface PoweredByBadgeProps {
    provider: keyof typeof PROVIDERS;
}

export function PoweredByBadge({ provider }: PoweredByBadgeProps) {
    return (
        <Row gap={8}>
            <Text variant="tertiary">
                <Translation id="TR_STAKE_PROVIDED_BY" />
            </Text>
            <ImageWrapper>
                <Image image={PROVIDERS[provider].logo} width={100} height={40} />
            </ImageWrapper>
        </Row>
    );
}
