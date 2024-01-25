import { AssetFiatBalance } from '@suite-common/assets';
import { AssetRow, AssetRowSkeleton } from './AssetRow';
import { AssetTableHeader } from './AssetTableHeader';
import { Network } from '@suite-common/wallet-config';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';
import { spacingsPx } from '@trezor/theme';

const Table = styled.div`
    padding-left: ${spacingsPx.xxs};
    padding-right: ${spacingsPx.xxs};
    padding-bottom: ${spacingsPx.xxs};
`;

export interface AssetTableRowType {
    symbol: string;
    network: Network;
    assetBalance: BigNumber;
    assetFailed: boolean;
}

interface AssetTableProps {
    discoveryInProgress?: boolean;
    assetsData: AssetTableRowType[];
    assetsFiatBalances: AssetFiatBalance[];
}

export const AssetTable = ({
    discoveryInProgress,
    assetsData,
    assetsFiatBalances,
}: AssetTableProps) => (
    <Table>
        <AssetTableHeader />
        {assetsData.map((asset, i) => (
            <AssetRow
                key={asset.symbol}
                network={asset.network}
                failed={asset.assetFailed}
                cryptoValue={asset.assetBalance.toFixed()}
                isLastRow={i === assetsData.length - 1 && !discoveryInProgress}
                assetsFiatBalances={assetsFiatBalances}
            />
        ))}
        {discoveryInProgress && <AssetRowSkeleton />}
    </Table>
);
