import { type ProviderMetadata } from 'invity-api';
import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { invityAPI } from '@suite-common/trading';
import { Box, Column, Row, Text } from '@trezor/components';
import { borders } from '@trezor/theme';

interface AllowanceModalProviderInfoProps {
    provider: ProviderMetadata;
    spender: string;
}

const ProviderLogo = styled.img`
    flex: none;
    width: 24px;
    height: 24px;
`;

export const AllowanceModalProviderInfo = ({
    provider,
    spender,
}: AllowanceModalProviderInfoProps) => (
    <Box padding={12} borderWidth={borders.widths.large} borderRadius={borders.radii.sm}>
        <Column gap={12}>
            <Text>
                <Translation id="TR_EXCHANGE_APPROVAL_PROVIDER" />
            </Text>
            <Row gap={8}>
                {provider.logo && (
                    <ProviderLogo src={invityAPI.getProviderLogoUrl(provider.logo)} alt="" />
                )}
                <Column>
                    {provider.companyName && <Text>{provider.companyName}</Text>}
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        {spender}
                    </Text>
                </Column>
            </Row>
        </Column>
    </Box>
);
