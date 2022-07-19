import React from 'react';
import styled, { useTheme } from 'styled-components';
import BigNumber from 'bignumber.js';
import { NETWORKS } from '@wallet-config';
import { Section } from '@dashboard-components';
import { AssetTable, AssetTableSkeleton } from './components/AssetTable';
import { AssetGrid, AssetGridSkeleton } from './components/AssetGrid';
import { Account, Network } from '@wallet-types';
import { variables, Icon, Button, colors, LoadingContent } from '@trezor/components';
import { Card, Translation } from '@suite-components';
import { useDiscovery, useActions, useSelector } from '@suite-hooks';
import { useAccounts } from '@wallet-hooks';
import * as suiteActions from '@suite-actions/suiteActions';
import * as routerActions from '@suite-actions/routerActions';
import { AnimatePresence } from 'framer-motion';

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

const ActionsWrapper = styled.div`
    display: flex;
    justify-content: space-around;
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

const GridWrapper = styled.div`
    display: grid;
    grid-gap: 10px;
    grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
`;

const StyledAddAccountButton = styled(Button)`
    margin-left: 20px;
`;

interface assetType {
    symbol: string;
    network: Network;
    assetBalance: BigNumber;
    assetFailed: boolean;
}

const AssetsCard = () => {
    const theme = useTheme();
    const { discovery, getDiscoveryStatus, isDiscoveryRunning } = useDiscovery();
    const { accounts } = useAccounts(discovery);
    const { dashboardAssetsGridMode } = useSelector(s => s.suite.flags);
    const { goto, setFlag } = useActions({
        goto: routerActions.goto,
        setFlag: suiteActions.setFlag,
    });

    const assets: { [key: string]: Account[] } = {};
    accounts.forEach(a => {
        if (!assets[a.symbol]) {
            assets[a.symbol] = [];
        }
        assets[a.symbol].push(a);
    });
    const networks = Object.keys(assets);

    const assetsData: assetType[] = networks
        .map(symbol => {
            const network = NETWORKS.find(n => n.symbol === symbol && !n.accountType);
            if (!network) {
                console.error('unknown network');
                return null;
            }

            const assetBalance = assets[symbol].reduce(
                (prev, a) => prev.plus(a.formattedBalance),
                new BigNumber(0),
            );

            const assetFailed = accounts.find(f => f.symbol === network.symbol && f.failed);
            return { symbol, network, assetFailed: !!assetFailed, assetBalance };
        })
        .filter(data => data !== null) as assetType[];

    const discoveryStatus = getDiscoveryStatus();
    const discoveryInProgress = discoveryStatus && discoveryStatus.status === 'loading';
    const isError = discoveryStatus && discoveryStatus.status === 'exception' && !networks.length;

    return (
        <Section
            heading={
                <>
                    <LoadingContent isLoading={isDiscoveryRunning}>
                        <Translation id="TR_MY_ASSETS" />
                    </LoadingContent>
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
            actions={
                <ActionsWrapper>
                    <Icon
                        icon="TABLE"
                        onClick={() => setFlag('dashboardAssetsGridMode', false)}
                        color={!dashboardAssetsGridMode ? colors.BG_GREEN : colors.TYPE_LIGHT_GREY}
                    />
                    <Icon
                        icon="GRID"
                        onClick={() => setFlag('dashboardAssetsGridMode', true)}
                        color={dashboardAssetsGridMode ? colors.BG_GREEN : colors.TYPE_LIGHT_GREY}
                    />
                </ActionsWrapper>
            }
        >
            {dashboardAssetsGridMode && (
                <GridWrapper>
                    {assetsData.map(asset => (
                        <AssetGrid
                            key={asset.symbol}
                            network={asset.network}
                            failed={asset.assetFailed}
                            cryptoValue={asset.assetBalance.toFixed()}
                        />
                    ))}
                    {discoveryInProgress && <AssetGridSkeleton />}
                </GridWrapper>
            )}
            {!dashboardAssetsGridMode && (
                <StyledCard>
                    <AnimatePresence initial={false}>
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
                            {assetsData.map((asset, i) => (
                                <AssetTable
                                    key={asset.symbol}
                                    network={asset.network}
                                    failed={asset.assetFailed}
                                    cryptoValue={asset.assetBalance.toFixed()}
                                    isLastRow={i === assetsData.length - 1}
                                />
                            ))}
                            {discoveryInProgress && <AssetTableSkeleton />}
                        </Grid>
                    </AnimatePresence>

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
            )}
        </Section>
    );
};

export default AssetsCard;
