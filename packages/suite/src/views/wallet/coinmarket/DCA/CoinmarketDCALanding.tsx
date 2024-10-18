import React from 'react';
import {
    Card,
    Column,
    Divider,
    H2,
    Icon,
    IconName,
    Image,
    Paragraph,
    Row,
    Text,
} from '@trezor/components';
import styled from 'styled-components';
import { borders, palette, spacings, spacingsPx } from '@trezor/theme';
import { Translation, TrezorLink } from 'src/components/suite';
import { COINMARKET_DOWNLOAD_INVITY_APP_URL } from '@trezor/urls';
import { useSelector } from 'src/hooks/suite';
import { variables } from '@trezor/components/src/config';
import { CoinmarketLayout } from 'src/views/wallet/coinmarket/common/CoinmarketLayout/CoinmarketLayout';
import { CoinmarketContainer } from 'src/views/wallet/coinmarket/common/CoinmarketContainer';

const IconWrapper = styled.div`
    display: flex;
    flex-shrink: 0;
    justify-content: center;
    align-items: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: ${palette.lightSecondaryLime500};
    margin-right: ${spacingsPx.sm};
`;

const WrappedText = styled.div`
    max-width: 200px;
    text-align: center;
`;

const ColumnsWrapper = styled.div`
    ${variables.SCREEN_QUERY.ABOVE_MOBILE} {
        display: flex;
    }
`;

const DCAColumn = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1 0 50%;
    padding: ${spacingsPx.xxl};
`;

const Column1 = styled(DCAColumn)`
    gap: ${spacingsPx.xxl};
    background-color: ${palette.lightPrimaryForest800};
    border-radius: ${borders.radii.md};
    color: ${palette.lightWhiteAlpha1000};
`;

const Column2 = styled(DCAColumn)`
    align-items: center;
    justify-content: center;
    gap: ${spacingsPx.md};
`;

const StoreBadge = styled.div<{ $isLight: boolean }>`
    ${({ $isLight }) => $isLight && `filter: invert(1);`}
    transition: opacity 0.3s;
    cursor: pointer;

    &:hover {
        opacity: 0.6;
    }
`;

const StoreSeparatorWrapper = styled.div`
    height: 26px;
`;

interface FeatureItemProps {
    icon: IconName;
    featureNumber: 1 | 2 | 3 | 4;
}

const FeatureItem = ({ icon, featureNumber }: FeatureItemProps) => (
    <Row>
        <IconWrapper>
            <Icon name={icon} size={20} color={palette.lightPrimaryForest800} />
        </IconWrapper>
        <div>
            <Text typographyStyle="highlight" color={palette.lightSecondaryLime500}>
                <Translation id={`TR_COINMARKET_DCA_FEATURE_${featureNumber}_SUBHEADING`} />
            </Text>
            <Paragraph>
                <Text color={palette.lightWhiteAlpha1000}>
                    <Translation id={`TR_COINMARKET_DCA_FEATURE_${featureNumber}_DESCRIPTION`} />
                </Text>
            </Paragraph>
        </div>
    </Row>
);

const DCALanding = () => {
    const currentTheme = useSelector(state => state.suite.settings.theme.variant);
    const isLightTheme = currentTheme !== 'dark';

    return (
        <CoinmarketLayout>
            <Card paddingType="small">
                <ColumnsWrapper>
                    <Column1>
                        <H2>
                            <Translation id="TR_COINMARKET_DCA_HEADING" />
                        </H2>
                        <Column gap={spacings.xxl} alignItems="start">
                            <FeatureItem icon="shieldCheck" featureNumber={1} />
                            <FeatureItem icon="arrowDown" featureNumber={2} />
                            <FeatureItem icon="lightning" featureNumber={3} />
                            <FeatureItem icon="eye" featureNumber={4} />
                        </Column>
                    </Column1>
                    <Column2>
                        <Image image="COINMARKET_INVITY_ICON" width={48} height={48} />
                        <WrappedText>
                            <Paragraph typographyStyle="highlight">
                                <Translation id="TR_COINMARKET_DCA_DOWNLOAD" />
                            </Paragraph>
                        </WrappedText>
                        <TrezorLink href={COINMARKET_DOWNLOAD_INVITY_APP_URL}>
                            <Image image="COINMARKET_DCA_INVITY_APP_QR" width={170} height={170} />
                        </TrezorLink>
                        <Row>
                            <TrezorLink href={COINMARKET_DOWNLOAD_INVITY_APP_URL}>
                                <StoreBadge $isLight={isLightTheme}>
                                    <Image image="PLAY_STORE_TITLE" height={26} />
                                </StoreBadge>
                            </TrezorLink>
                            <StoreSeparatorWrapper>
                                <Divider
                                    orientation="vertical"
                                    strokeWidth={1}
                                    margin={{ left: spacings.sm, right: spacings.sm }}
                                />
                            </StoreSeparatorWrapper>
                            <TrezorLink href={COINMARKET_DOWNLOAD_INVITY_APP_URL}>
                                <StoreBadge $isLight={isLightTheme}>
                                    <Image image="APP_STORE_TITLE" height={26} />
                                </StoreBadge>
                            </TrezorLink>
                        </Row>
                    </Column2>
                </ColumnsWrapper>
            </Card>
        </CoinmarketLayout>
    );
};

export const CoinmarketDCALanding = () => (
    <CoinmarketContainer title="TR_COINMARKET_BUY_AND_SELL" SectionComponent={DCALanding} />
);
