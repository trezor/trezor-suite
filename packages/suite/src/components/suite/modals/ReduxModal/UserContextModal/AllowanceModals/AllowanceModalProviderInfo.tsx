import styled from 'styled-components';

import { Translation, type TranslationKey } from '@suite/intl';
import { CardList, Column, Image, Row, Text } from '@trezor/components';
import { borders } from '@trezor/theme';

export type AllowanceModalProvider = {
    name?: string;
    companyName?: string;
    logo?: string;
    label: TranslationKey;
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
    gap: 0.5rem;
`;

export const AllowanceModalProviderInfo = ({
    provider,
    spender,
    showSpender,
}: AllowanceModalProviderInfoProps) => {
    const providerName = provider.companyName ?? provider.name;

    return (
        <CardList.Item paddingType={showSpender ? 'medium' : 'normal'}>
            <Text typographyStyle="body-sm">
                <Translation id={provider.label} />
            </Text>
            <Column alignItems="flex-end" gap={2}>
                <Logo>
                    {provider.logo && (
                        <Row alignItems="center" justifyContent="center">
                            <Image
                                imageSrc={provider.logo}
                                maxHeight={20}
                                borderRadius={borders.radii.xxxs}
                            />
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
