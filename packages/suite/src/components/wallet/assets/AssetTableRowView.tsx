import { type ReactNode } from 'react';

import { ASSET_TABLE_CELL_PADDING, ASSET_TABLE_LINE_GAP } from '@suite/assets';
import { type TokenAddress, type TokenSymbol } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Column, Table } from '@trezor/components';

import { PriceTicker } from '#src/components/suite/Ticker/PriceTicker';
import { TrendTicker } from '#src/components/suite/Ticker/TrendTicker';

import { AssetApyBadge } from './AssetApyBadge';
import { AssetIdentity } from './AssetIdentity';
import { AssetTableAmount } from './AssetTableAmount';

type AssetTableRowViewProps = {
    networkSymbol: NetworkSymbol;
    contractAddress: TokenAddress | undefined;
    tokenSymbol: TokenSymbol | null;
    tokenDecimals: number | undefined;
    amount: string | undefined;
    /** Shown by the asset's name in place of the rate it can earn. */
    badge?: ReactNode;
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
    badge,
    onOpen,
    hasBorderTop,
    assetNameTestId,
    'data-testid': dataTestId,
}: AssetTableRowViewProps) => (
    <Table.Row hasBorderTop={hasBorderTop} onClick={onOpen} data-testid={dataTestId}>
        <Table.Cell padding={ASSET_TABLE_CELL_PADDING.first} data-testid={assetNameTestId}>
            <AssetIdentity
                symbol={networkSymbol}
                contractAddress={contractAddress}
                badge={
                    badge ?? (
                        <AssetApyBadge
                            symbol={networkSymbol}
                            contractAddress={contractAddress}
                            tokenSymbol={tokenSymbol}
                            tokenDecimals={tokenDecimals}
                        />
                    )
                }
            />
        </Table.Cell>

        <Table.Cell align="end">
            <Column alignItems="flex-end" gap={ASSET_TABLE_LINE_GAP}>
                <PriceTicker symbol={networkSymbol} contractAddress={contractAddress} />
                <TrendTicker symbol={networkSymbol} contractAddress={contractAddress} />
            </Column>
        </Table.Cell>

        <Table.Cell align="end" padding={ASSET_TABLE_CELL_PADDING.last}>
            {amount !== undefined && (
                <AssetTableAmount
                    symbol={networkSymbol}
                    contractAddress={contractAddress}
                    amount={amount}
                />
            )}
        </Table.Cell>
    </Table.Row>
);
