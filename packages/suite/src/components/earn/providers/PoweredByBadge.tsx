import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { type EarnProviderId, earnProviderInfo } from '@suite-common/earn-api';
import { Image, Row, Text } from '@trezor/components';

const ImageWrapper = styled.div`
    filter: ${({ theme }) => (theme.variant === 'dark' ? 'invert(1)' : 'none')};
`;

type PoweredByBadgeProps = {
    provider: EarnProviderId;
};

export function PoweredByBadge({ provider }: PoweredByBadgeProps) {
    return (
        <Row gap={8}>
            <Text intent="neutral" priority="secondary">
                <Translation id="TR_STAKE_PROVIDED_BY" />
            </Text>
            <ImageWrapper>
                <Image image={earnProviderInfo[provider].logo} width={100} height={40} />
            </ImageWrapper>
        </Row>
    );
}
