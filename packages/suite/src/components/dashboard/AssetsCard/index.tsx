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
    border-radius: 6px 6px 0px 0px;
    padding: 10px ${CARD_PADDING_SIZE};
`;

const HeaderTitle = styled.div`
    flex: 1;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${colors.BLACK50};
    text-transform: uppercase;
    display: grid;
    grid-gap: 10px;

    grid-template-columns: 2fr 1fr 1fr 1fr 1fr;

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        grid-template-columns: 1fr 1fr 1fr;
    }
`;

const StyledCard = styled(Card)`
    flex-direction: column;
    padding: 0px ${CARD_PADDING_SIZE};
`;

// padding for loader need to math with first row height
const InfoMessage = styled.div`
    padding: 14px 0px;
    display: flex;
    color: ${colors.RED};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.REGULAR};
`;

const BalanceHeader = styled.div`
    display: flex;
    justify-content: center;
`;

const Grid = styled.div`
    display: grid;
    overflow: hidden;
    grid-template-columns: 2fr 1fr 1fr 1fr 1fr;

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        grid-template-columns: 1fr 1fr 1fr;
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
                <HeaderTitle>
                    {/* todo */}
                    <div>
                        <Translation id="TR_ASSETS" />
                    </div>
                    <BalanceHeader>
                        <Translation id="TR_VALUES" />
                    </BalanceHeader>
                    <div />
                    <div>
                        <Translation id="TR_EXCHANGE_RATE" />
                    </div>
                    <div />
                </HeaderTitle>
            </Header>
            <StyledCard>
                <Grid>
                    {networks.map((symbol, i) => {
                        const network = NETWORKS.find(n => n.symbol === symbol && !n.accountType);
                        if (!network) {
                            return 'unknown network';
                        }

                        const assetBalance = assets[symbol].reduce(
                            (prev, a) => prev.plus(a.formattedBalance),
                            new BigNumber(0),
                        );

                        const assetFailed = accounts.find(
                            f => f.symbol === network.symbol && f.failed,
                        );

                        return (
                            <Asset
                                key={symbol}
                                network={network}
                                failed={!!assetFailed}
                                cryptoValue={assetBalance.toFixed()}
                                isFirstRow={i === 0}
                            />
                        );
                    })}
                </Grid>
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
