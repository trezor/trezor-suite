import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { invityAPI } from '@suite-common/trading';
import { Box, Column, Row, Text } from '@trezor/components';
import { borders } from '@trezor/theme';

import type { AllowanceProvider } from './types';

interface AllowanceModalProviderInfoProps {
    provider: AllowanceProvider;
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
}: AllowanceModalProviderInfoProps) => {
    let logoUrl: string | null = null;

    if (provider.logo) {
        logoUrl =
            provider.logoSource === 'url'
                ? provider.logo
                : invityAPI.getProviderLogoUrl(provider.logo);
    }

    return (
        <Box padding={12} borderWidth={borders.widths.large} borderRadius={borders.radii.sm}>
            <Column gap={12}>
                <Text>
                    <Translation id="TR_EXCHANGE_APPROVAL_PROVIDER" />
                </Text>
                <Row gap={8}>
                    {logoUrl && <ProviderLogo src={logoUrl} alt="" />}
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
};
