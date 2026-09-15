import styled from 'styled-components';

import { AssetIcon, type AssetIconProps } from '@suite/asset-icon';
import { Translation, type TranslationKey } from '@suite/intl';
import { CardList, Column, Image, Row, Text } from '@trezor/components';

export type AllowanceModalProvider = {
    name?: string;
    companyName?: string;
    logo?: string | AssetIconProps;
    label: TranslationKey;
    kind?: 'provider' | 'vault';
};

interface AllowanceModalProviderInfoProps {
    provider: AllowanceModalProvider;
    spender: string;
    showSpender?: boolean;
}

const Logo = styled.div`
    display: grid;
    grid-template-columns: 1.25rem auto;
    align-items: center;
    gap: 8px;
`;

export const AllowanceModalProviderInfo = ({
    provider,
    spender,
    showSpender,
}: AllowanceModalProviderInfoProps) => {
    const providerName = provider.companyName ?? provider.name;

    return (
        <CardList.Item>
            <Text typographyStyle="body-sm">
                <Translation id={provider.label} />
            </Text>
            <Column alignItems="flex-end" gap={2}>
                <Logo data-testid="@modal/approve/provider-value">
                    {provider.logo && (
                        <Row alignItems="center" justifyContent="center">
                            {typeof provider.logo === 'string' ? (
                                <Image imageSrc={provider.logo} maxHeight={20} borderRadius={4} />
                            ) : (
                                <AssetIcon {...provider.logo} />
                            )}
                        </Row>
                    )}
                    <Text typographyStyle="body-sm">{providerName}</Text>
                </Logo>
                {showSpender && (
                    <Text
                        typographyStyle="body-xs"
                        intent="neutral"
                        priority="secondary"
                        wordBreak="break-all"
                    >
                        {spender}
                    </Text>
                )}
            </Column>
        </CardList.Item>
    );
};
