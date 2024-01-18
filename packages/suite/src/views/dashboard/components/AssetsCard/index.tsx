import styled, { useTheme } from 'styled-components';
import BigNumber from 'bignumber.js';
import { AnimatePresence } from 'framer-motion';

import { variables, Icon, Button, colors, LoadingContent } from '@trezor/components';
import { selectDeviceSupportedNetworks } from '@suite-common/wallet-core';

import { NETWORKS } from 'src/config/wallet';
import { DashboardSection } from 'src/components/dashboard';
import { Account, Network } from 'src/types/wallet';
import { Card, Translation } from 'src/components/suite';
import { useDiscovery, useDispatch, useSelector } from 'src/hooks/suite';
import { useAccounts } from 'src/hooks/wallet';
import { setFlag } from 'src/actions/suite/suiteActions';
import { goto } from 'src/actions/suite/routerActions';
import { useEnabledNetworks } from 'src/hooks/settings/useEnabledNetworks';

import { AssetGrid, AssetGridSkeleton } from './components/AssetGrid';
import { AssetTable, AssetTableSkeleton } from './components/AssetTable';

const StyledCard = styled(Card)`
    flex-direction: column;
    padding: 0;
`;

const InfoMessage = styled.div`
    padding: 16px 25px;
    display: flex;
    color: ${({ theme }) => theme.TYPE_RED};
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
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: 500;
    line-height: 1.57;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid ${({ theme }) => theme.STROKE_GREY};

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
    grid-template-columns: 2fr 2fr 1fr 1fr;
`;

const GridWrapper = styled.div`
    display: grid;
    grid-gap: 10px;
    grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
`;

const StyledAddAccountButton = styled(Button)`
    margin-left: 20px;
`;

const StyledIcon = styled(Icon)`
    margin-right: 4px;
`;

interface assetType {
    symbol: string;
    network: Network;
    assetBalance: BigNumber;
    assetFailed: boolean;
}

const AssetsCard = () => {
    const theme = useTheme();
    const dispatch = useDispatch();
    const { discovery, getDiscoveryStatus, isDiscoveryRunning } = useDiscovery();
    const { accounts } = useAccounts(discovery);
    const { dashboardAssetsGridMode } = useSelector(s => s.suite.flags);

    const { mainnets, enabledNetworks } = useEnabledNetworks();
    const deviceSupportedNetworks = useSelector(selectDeviceSupportedNetworks);

    const mainnetSymbols = mainnets.map(mainnet => mainnet.symbol);
    const supportedMainnetNetworks = deviceSupportedNetworks.filter(network =>
        mainnetSymbols.includes(network),
    );
    const hasMainnetNetworksToEnable = supportedMainnetNetworks.some(
        network => !enabledNetworks.includes(network),
    );

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

    const goToCoinsSettings = () => dispatch(goto('settings-coins'));
    const setTable = () => dispatch(setFlag('dashboardAssetsGridMode', false));
    const setGrid = () => dispatch(setFlag('dashboardAssetsGridMode', true));

    return (
        <DashboardSection
            heading={
                <>
                    <LoadingContent isLoading={isDiscoveryRunning}>
                        <Translation id="TR_MY_ASSETS" />
                    </LoadingContent>
                    {hasMainnetNetworksToEnable && (
                        <StyledAddAccountButton
                            variant="tertiary"
                            icon="PLUS"
                            onClick={goToCoinsSettings}
                        >
                            <Translation id="TR_ENABLE_MORE_COINS" />
                        </StyledAddAccountButton>
                    )}
                </>
            }
            actions={
                <ActionsWrapper>
                    <Icon
                        icon="TABLE"
                        data-test="@dashboard/assets/table-icon"
                        onClick={setTable}
                        color={!dashboardAssetsGridMode ? colors.BG_GREEN : colors.TYPE_LIGHT_GREY}
                    />
                    <Icon
                        icon="GRID"
                        data-test="@dashboard/assets/grid-icon"
                        onClick={setGrid}
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
                            {/* empty column */}
                            <Header />
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
                            <StyledIcon icon="WARNING" color={theme.TYPE_RED} size={14} />
                            <Translation id="TR_DASHBOARD_ASSETS_ERROR" />
                        </InfoMessage>
                    )}
                </StyledCard>
            )}
        </DashboardSection>
    );
};

export default AssetsCard;
