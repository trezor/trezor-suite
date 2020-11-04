import React from 'react';
import styled, { useTheme } from 'styled-components';
import BigNumber from 'bignumber.js';
import { NETWORKS } from '@wallet-config';
import { Section } from '@dashboard-components';
import Asset from './components/Asset';
import { Account } from '@wallet-types';
import { variables, Loader, Icon, Button } from '@trezor/components';
import { Card, Translation } from '@suite-components';
import { useDiscovery, useActions } from '@suite-hooks';
import { useAccounts } from '@wallet-hooks';
import * as routerActions from '@suite-actions/routerActions';

const StyledCard = styled(Card)`
    flex-direction: column;
    padding: 0px;
`;

const InfoMessage = styled.div`
    padding: 16px 25px;
    display: flex;
    color: ${props => props.theme.TYPE_RED};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.REGULAR};
`;

const Header = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-weight: 500;
    line-height: 1.57;
    align-items: center;
    padding: 12px 0px;
    border-bottom: 1px solid ${props => props.theme.STROKE_GREY};

    &:first-child {
        padding-left: 18px;
    }
    &:last-child {
        padding-right: 18px;
    }
`;

const Grid = styled.div`
    display: grid;
    overflow: hidden;
    grid-template-columns: 2fr 2fr 1fr;
`;

const StyledAddAccountButton = styled(Button)`
    margin-left: 20px;
`;

const AssetsCard = () => {
    const theme = useTheme();
    const { discovery, getDiscoveryStatus } = useDiscovery();
    const { accounts } = useAccounts(discovery);
    const { goto } = useActions({
        goto: routerActions.goto,
    });

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
        <Section
            heading={
                <>
                    <Translation id="TR_MY_ASSETS" />
                    {/* This button is interim solution as described here https://github.com/trezor/trezor-suite/issues/2329 */}
                    <StyledAddAccountButton
                        variant="tertiary"
                        icon="PLUS"
                        onClick={() => goto('settings-coins')}
                    >
                        <Translation id="TR_ENABLE_MORE_COINS" />
                    </StyledAddAccountButton>
                </>
            }
        >
            <StyledCard>
                <Grid>
                    <Header>
                        <Translation id="TR_ASSETS" />
                    </Header>
                    <Header>
                        <Translation id="TR_VALUES" />
                    </Header>
                    <Header>
                        <Translation id="TR_EXCHANGE_RATE" />
                    </Header>
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
                                isLastRow={i === networks.length - 1}
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
                            color={theme.TYPE_RED}
                            size={14}
                        />
                        <Translation id="TR_DASHBOARD_ASSETS_ERROR" />
                    </InfoMessage>
                )}
            </StyledCard>
        </Section>
    );
};

export default AssetsCard;
