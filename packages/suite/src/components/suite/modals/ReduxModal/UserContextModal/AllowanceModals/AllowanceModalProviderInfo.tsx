import styled from 'styled-components';

import { Translation, type TranslationKey } from '@suite/intl';
import { invityAPI } from '@suite-common/trading';
import { Box, Column, Row, Text } from '@trezor/components';
import { borders } from '@trezor/theme';
import { exhaustive } from '@trezor/type-utils';

export type ProviderLogoSourceType = 'invity-api-path' | 'url';

export type AllowanceModalProvider = {
    name?: string;
    companyName?: string;
    logo?: string;
    label?: TranslationKey;
};

interface AllowanceModalProviderInfoProps {
    provider: AllowanceModalProvider;
    spender: string;
    logoSourceType?: ProviderLogoSourceType;
}

const ProviderLogo = styled.img`
    flex: none;
    width: 24px;
    height: 24px;
`;

const getProviderLogoSource = (
    logo: string | undefined,
    logoSourceType: ProviderLogoSourceType = 'invity-api-path',
) => {
    if (!logo) {
        return null;
    }

    switch (logoSourceType) {
        case 'url':
            return logo;
        case 'invity-api-path':
            return invityAPI.getProviderLogoUrl(logo);
        default:
            return exhaustive(logoSourceType);
    }
};

export const AllowanceModalProviderInfo = ({
    provider,
    spender,
    logoSourceType,
}: AllowanceModalProviderInfoProps) => {
    const providerLogoSource = getProviderLogoSource(provider.logo, logoSourceType);
    const providerName = provider.companyName ?? provider.name;

    return (
        <Box padding={12} borderWidth={borders.widths.large} borderRadius={borders.radii.sm}>
            <Column gap={12}>
                <Text>
                    <Translation id={provider.label ?? 'TR_EXCHANGE_APPROVAL_PROVIDER'} />
                </Text>
                <Row gap={8}>
                    {providerLogoSource && <ProviderLogo src={providerLogoSource} alt="" />}
                    <Column>
                        {providerName && <Text>{providerName}</Text>}
                        <Text
                            typographyStyle="body-sm"
                            intent="neutral"
                            priority="secondary"
                            wordBreak="break-all"
                        >
                            {spender}
                        </Text>
                    </Column>
                </Row>
            </Column>
        </Box>
    );
};
