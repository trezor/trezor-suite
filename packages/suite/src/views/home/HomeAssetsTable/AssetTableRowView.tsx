import { type TokenAddress, type TokenSymbol } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Column, Table } from '@trezor/components';

import { PriceTicker } from '#src/components/suite/Ticker/PriceTicker';
import { TrendTicker } from '#src/components/suite/Ticker/TrendTicker';

import { HomeAssetAmount } from './HomeAssetAmount';
import { HomeAssetApyBadge } from './HomeAssetApyBadge';
import { HomeAssetIdentity } from './HomeAssetIdentity';
import { HOME_ASSET_CELL_PADDING, HOME_ASSET_LINE_GAP } from './homeAssetTableLayout';

type AssetTableRowViewProps = {
    networkSymbol: NetworkSymbol;
    contractAddress: TokenAddress | undefined;
    tokenSymbol: TokenSymbol | null;
    tokenDecimals: number | undefined;
    amount: string | undefined;
    onOpen: () => void;
    hasBorderTop?: boolean;
    assetNameTestId?: string;
    'data-testid': string;
};

/** A row of an asset table: the asset, its price and trend, and how much of it is held. */
export const AssetTableRowView = ({
    networkSymbol,
    contractAddress,
    tokenSymbol,
    tokenDecimals,
    amount,
    onOpen,
    hasBorderTop,
    assetNameTestId,
    'data-testid': dataTestId,
}: AssetTableRowViewProps) => (
    <Table.Row hasBorderTop={hasBorderTop} onClick={onOpen} data-testid={dataTestId}>
        <Table.Cell padding={HOME_ASSET_CELL_PADDING.first} data-testid={assetNameTestId}>
            <HomeAssetIdentity
                symbol={networkSymbol}
                contractAddress={contractAddress}
                badge={
                    <HomeAssetApyBadge
                        symbol={networkSymbol}
                        contractAddress={contractAddress}
                        tokenSymbol={tokenSymbol}
                        tokenDecimals={tokenDecimals}
                    />
                }
            />
        </Table.Cell>

        <Table.Cell align="end">
            <Column alignItems="flex-end" gap={HOME_ASSET_LINE_GAP}>
                <PriceTicker symbol={networkSymbol} contractAddress={contractAddress} />
                <TrendTicker symbol={networkSymbol} contractAddress={contractAddress} />
            </Column>
        </Table.Cell>

        <Table.Cell align="end" padding={HOME_ASSET_CELL_PADDING.last}>
            {amount !== undefined && (
                <HomeAssetAmount
                    symbol={networkSymbol}
                    contractAddress={contractAddress}
                    amount={amount}
                />
            )}
        </Table.Cell>
    </Table.Row>
);
