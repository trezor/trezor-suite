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

type AssetRowProps = {
    variant?: 'asset';
    contractAddress: TokenAddress | undefined;
    tokenSymbol: TokenSymbol | null;
    tokenDecimals: number | undefined;
};

/** A stake of the coin: no token of its own, and no price, which the coin's own row shows. */
type StakingRowProps = {
    variant: 'staking';
};

type AssetTableRowViewProps = (AssetRowProps | StakingRowProps) & {
    networkSymbol: NetworkSymbol;
    amount: string | undefined;
    /** Shown by the asset's name in place of the rate it can earn; `null` shows none. */
    badge?: ReactNode;
    onOpen?: () => void;
    hasBorderTop?: boolean;
    assetNameTestId?: string;
    'data-testid': string;
};

/** A row of an asset table: the asset, its price and trend, and how much of it is held. */
export const AssetTableRowView = (props: AssetTableRowViewProps) => {
    const { networkSymbol, amount, badge, onOpen, hasBorderTop, assetNameTestId } = props;
    const isStaking = props.variant === 'staking';
    const contractAddress = isStaking ? undefined : props.contractAddress;
    const rateBadge = isStaking ? null : (
        <AssetApyBadge
            symbol={networkSymbol}
            contractAddress={props.contractAddress}
            tokenSymbol={props.tokenSymbol}
            tokenDecimals={props.tokenDecimals}
        />
    );

    return (
        <Table.Row hasBorderTop={hasBorderTop} onClick={onOpen} data-testid={props['data-testid']}>
            <Table.Cell padding={ASSET_TABLE_CELL_PADDING.first} data-testid={assetNameTestId}>
                <AssetIdentity
                    symbol={networkSymbol}
                    contractAddress={contractAddress}
                    variant={isStaking ? 'staking' : 'asset'}
                    badge={badge === undefined ? rateBadge : badge}
                />
            </Table.Cell>

            <Table.Cell align="end">
                {!isStaking && (
                    <Column alignItems="flex-end" gap={ASSET_TABLE_LINE_GAP}>
                        <PriceTicker symbol={networkSymbol} contractAddress={contractAddress} />
                        <TrendTicker symbol={networkSymbol} contractAddress={contractAddress} />
                    </Column>
                )}
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
};
