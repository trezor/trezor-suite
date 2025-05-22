import React, { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import styled from 'styled-components';

import { selectSelectedDevice } from '@suite-common/wallet-core';
import {
    BulletList,
    Button,
    Card,
    Column,
    H2,
    Icon,
    IconName,
    Image,
    Paragraph,
    Row,
    Text,
    Tooltip,
} from '@trezor/components';
import { BulletListItem } from '@trezor/components/src/components/BulletList/BulletListItem';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';
import { spacings, spacingsPx } from '@trezor/theme';
import { TRADING_DOWNLOAD_INVITY_APP_URL } from '@trezor/urls';

import { openModal } from 'src/actions/suite/modalActions';
import { Translation, TrezorLink } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { CoinjoinRootState } from 'src/reducers/wallet/coinjoinReducer';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingLayout } from 'src/views/wallet/trading/common/TradingLayout/TradingLayout';

const IconWrapper = styled.div`
    display: flex;
    flex-shrink: 0;
    justify-content: center;
    align-items: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: ${({ theme }) => theme.backgroundSurfaceElevation0};
    margin-right: ${spacingsPx.sm};
`;

const ColumnsWrapper = styled.div`
    ${SCREEN_QUERY.ABOVE_DESKTOP} {
        display: flex;
        flex-direction: row;
    }
`;

const StoreBadge = styled.div<{ $isLight: boolean }>`
    display: flex;
    justify-content: center;
    ${({ $isLight }) => $isLight && `filter: invert(1);`}
    transition: opacity 0.3s;
    cursor: pointer;

    &:hover {
        opacity: 0.6;
    }
`;

interface FeatureItemProps {
    icon: IconName;
    featureNumber: 1 | 2 | 3;
}

const DCACardsWrapper = styled.div`
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-gap: 20px;

    ${SCREEN_QUERY.BELOW_DESKTOP} {
        grid-template-columns: 1fr;
    }
`;

const FeatureItem = ({ icon, featureNumber }: FeatureItemProps) => (
    <Row>
        <IconWrapper>
            <Icon name={icon} size={20} />
        </IconWrapper>
        <div>
            <Text>
                <Translation id={`TR_TRADING_DCA_FEATURE_${featureNumber}_SUBHEADING`} />
            </Text>
            <Paragraph>
                <Text variant="tertiary">
                    <Translation id={`TR_TRADING_DCA_FEATURE_${featureNumber}_DESCRIPTION`} />
                </Text>
            </Paragraph>
        </div>
    </Row>
);

interface GetAppCardProps {
    isLightTheme: boolean;
}

const GetAppCard = ({ isLightTheme }: GetAppCardProps) => (
    <Card>
        <Row gap={spacings.lg} alignItems="stretch">
            <TrezorLink href={TRADING_DOWNLOAD_INVITY_APP_URL}>
                <Image image="TRADING_DCA_INVITY_APP_QR" width={100} height={100} />
            </TrezorLink>
            <Column justifyContent="center" gap={spacings.xxs}>
                <TrezorLink href={TRADING_DOWNLOAD_INVITY_APP_URL}>
                    <StoreBadge $isLight={isLightTheme}>
                        <Image image="PLAY_STORE_BADGE" height={32} />
                    </StoreBadge>
                </TrezorLink>
                <TrezorLink href={TRADING_DOWNLOAD_INVITY_APP_URL}>
                    <StoreBadge $isLight={isLightTheme}>
                        <Image image="APP_STORE_BADGE" height={32} />
                    </StoreBadge>
                </TrezorLink>
            </Column>
        </Row>
    </Card>
);

interface StepCardProps {
    heading: ReactNode;
    description: ReactNode;
    bottomContent?: ReactNode;
    icon?: IconName;
}

const StepCard = ({ heading, description, bottomContent, icon }: StepCardProps) => (
    <Card minHeight="210px">
        <Column justifyContent="space-between" height="100%" gap={spacings.sm}>
            <Column gap={spacings.sm}>
                <Row justifyContent="space-between">
                    <div>
                        <BulletListItem title="" />
                    </div>
                    {icon && <Icon name={icon} size={40} />}
                </Row>

                <div>
                    <Text>{heading}</Text>

                    <Paragraph>
                        <Text variant="tertiary">{description}</Text>
                    </Paragraph>
                </div>
            </Column>

            {bottomContent}
        </Column>
    </Card>
);

interface GetButtonProps {
    networkType?: string;
    onClick: () => void;
}

const getButton = ({ networkType, onClick }: GetButtonProps) => {
    if (networkType !== 'bitcoin') {
        return (
            <Button onClick={onClick} isDisabled>
                <Tooltip
                    content={
                        <FormattedMessage
                            id="TR_TRADING_DCA_AVAILABLE_ONLY_FOR_BITCOIN"
                            defaultMessage="DCA is available only for Bitcoin"
                        />
                    }
                    cursor="default"
                >
                    <Text>
                        <Translation id="TR_TRADING_DCA_STEP_CARD_SELECT_ADDRESS" />
                    </Text>
                </Tooltip>
            </Button>
        );
    }

    return (
        <Button onClick={onClick}>
            <Text>
                <Translation id="TR_TRADING_DCA_STEP_CARD_SELECT_ADDRESS" />
            </Text>
        </Button>
    );
};

const DCALanding = () => {
    const currentTheme = useSelector(state => state.suite.settings.theme.variant);
    const isLightTheme = currentTheme !== 'dark';
    const dispatch = useDispatch();
    const device = useSelector(selectSelectedDevice);
    const { account } = useSelector((state: CoinjoinRootState) => state.wallet.selectedAccount);

    const handleOnClick = () => {
        if (!device) {
            return;
        }

        dispatch(
            openModal({
                type: 'trading-dca',
                device,
            }),
        );
    };

    return (
        <TradingLayout>
            <Card paddingType="small">
                <ColumnsWrapper>
                    <Column
                        padding={spacings.xxl}
                        justifyContent="center"
                        gap={spacings.xxl}
                        flex="1 0 50%"
                    >
                        <H2>
                            <Translation id="TR_TRADING_DCA_HEADING" />
                        </H2>
                        <Column gap={spacings.xxl} alignItems="start">
                            <FeatureItem icon="suitcaseSimple" featureNumber={1} />
                            <FeatureItem icon="shieldCheck" featureNumber={2} />
                            <FeatureItem icon="handCoins" featureNumber={3} />
                        </Column>
                    </Column>
                    <Column padding={spacings.xxl} justifyContent="center" maxWidth={500}>
                        <Image
                            image={
                                isLightTheme
                                    ? 'TRADING_DCA_INVITY_APP'
                                    : 'TRADING_DCA_INVITY_APP_DARK'
                            }
                            isFilterActive={false}
                        />
                    </Column>
                </ColumnsWrapper>

                <BulletList isOrdered bulletSize="large" bulletGap={16} gap={16}>
                    <DCACardsWrapper>
                        <StepCard
                            heading={<Translation id="TR_TRADING_DCA_STEP_CARD_1_SUBHEADING" />}
                            description={
                                <Translation id="TR_TRADING_DCA_STEP_CARD_1_DESCRIPTION" />
                            }
                            bottomContent={<GetAppCard isLightTheme={isLightTheme} />}
                        />
                        <StepCard
                            heading={<Translation id="TR_TRADING_DCA_STEP_CARD_2_SUBHEADING" />}
                            description={
                                <Translation id="TR_TRADING_DCA_STEP_CARD_2_DESCRIPTION" />
                            }
                        />
                        <StepCard
                            heading={<Translation id="TR_TRADING_DCA_STEP_CARD_3_SUBHEADING" />}
                            description={
                                <Translation id="TR_TRADING_DCA_STEP_CARD_3_DESCRIPTION" />
                            }
                            icon="trezorLogo"
                            bottomContent={getButton({
                                networkType: account?.networkType,
                                onClick: handleOnClick,
                            })}
                        />
                    </DCACardsWrapper>
                </BulletList>
            </Card>
        </TradingLayout>
    );
};

export const TradingDCALanding = () => <TradingContainer SectionComponent={DCALanding} />;
