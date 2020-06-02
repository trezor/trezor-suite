import React from 'react';
import styled from 'styled-components';
import BigNumber from 'bignumber.js';
import { NETWORKS } from '@wallet-config';
import Asset from './components/Asset';
import { Account } from '@wallet-types';
import { colors, variables, Loader, Icon } from '@trezor/components';
import { Card, Translation } from '@suite-components';
import { CARD_PADDING_SIZE } from '@suite/constants/suite/layout';
import { useDiscovery } from '@suite-hooks';
import { useAccounts } from '@wallet-hooks';

const Header = styled.div`
    display: flex;
    padding: 12px;
    flex-direction: row;
    font-size: ${variables.FONT_SIZE.TINY};
    align-items: center;
`;

const Title = styled.div`
    flex: 1;
    margin-bottom: 2px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    text-transform: uppercase;
    color: ${colors.BLACK50};
`;

const StyledCard = styled(Card)`
    flex-direction: column;
    padding: 0;
`;

const CardHeader = styled.div`
    display: flex;
    align-items: center;
    padding: 15px ${CARD_PADDING_SIZE};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${colors.BLACK50};
    border-bottom: 1px solid ${colors.BLACK96};

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        display: none;
    }
`;

const NameTitle = styled.div`
    flex: auto;
    width: 25%;
`;

const AmountTitle = styled.div`
    flex: auto;
    width: 25%;
`;

const ChartTitle = styled.div`
    flex: auto;
    text-align: center;
    width: 15%;
`;

const ChangeTitle = styled.div`
    flex: auto;
    text-align: center;
    width: 15%;
`;

const PriceTitle = styled.div`
    flex: auto;
    text-align: right;
    width: 15%;
`;

// padding for loader need to math with first row height
const InfoMessage = styled.div`
    padding: 14px 0px;
    display: flex;
    color: ${colors.RED};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.REGULAR};
`;

const Grid = styled.div`
    display: grid;
    overflow: hidden;
    grid-template-columns: 40px 3fr 3fr 2fr 2fr 2fr;
    grid-template-areas: 'logo label value chart change fiat';
    align-items: center;
    margin: 0 10px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        grid-template-columns: 32px 1fr 1fr;
        grid-template-rows: 1fr 1fr;
        grid-template-areas:
            'logo label value'
            'logo fiat value';
    }

    & + & {
        border-top: 1px solid ${colors.BLACK96};
    }
`;

const AssetsCard = () => {
    const { discovery, getDiscoveryStatus } = useDiscovery();
    const { accounts } = useAccounts(discovery);

    const assets: { [key: string]: Account[] } = {};
    accounts.forEach(a => {
        if (!assets[a.symbol]) {
            assets[a.symbol] = [];
        }
        assets[a.symbol].push(a);
    });
    const networks = Object.keys(assets);

    const discoveryStatus = getDiscoveryStatus();
    const isLoading =
        discoveryStatus && discoveryStatus.status === 'loading' && networks.length < 1;
    const isError = discoveryStatus && discoveryStatus.status === 'exception' && !networks.length;

    return (
        <>
            <Header>
                <Title>
                    <Translation id="TR_ASSETS" />
                </Title>
            </Header>

            <StyledCard>
                <CardHeader>
                    <NameTitle>
                        <Translation id="TR_NAME" />
                    </NameTitle>
                    <AmountTitle>
                        <Translation id="TR_AMOUNT" />
                    </AmountTitle>
                    <ChartTitle>
                        <Translation id="TR_CHART_24" />
                    </ChartTitle>
                    <ChangeTitle>
                        <Translation id="TR_CHANGE_24" />
                    </ChangeTitle>
                    <PriceTitle>
                        <Translation id="TR_PRICE" />
                    </PriceTitle>
                </CardHeader>

                {networks.map(symbol => {
                    const network = NETWORKS.find(n => n.symbol === symbol && !n.accountType);
                    if (!network) {
                        return 'unknown network';
                    }

                    const assetBalance = assets[symbol].reduce(
                        (prev, a) => prev.plus(a.formattedBalance),
                        new BigNumber(0),
                    );

                    const assetFailed = accounts.find(f => f.symbol === network.symbol && f.failed);

                    return (
                        <Grid>
                            <Asset
                                key={symbol}
                                network={network}
                                failed={!!assetFailed}
                                cryptoValue={assetBalance.toFixed()}
                            />
                        </Grid>
                    );
                })}

                {isLoading && (
                    <InfoMessage>
                        <Loader size={20} />
                    </InfoMessage>
                )}
                {isError && (
                    <InfoMessage>
                        <Icon
                            style={{ paddingRight: '4px', paddingBottom: '2px' }}
                            icon="WARNING"
                            color={colors.RED}
                            size={14}
                        />
                        <Translation id="TR_DASHBOARD_ASSETS_ERROR" />
                    </InfoMessage>
                )}
            </StyledCard>
        </>
    );
};

export default AssetsCard;
