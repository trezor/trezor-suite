import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { type AssetKey } from '@suite-common/wallet-core';
import { Table } from '@trezor/components';

import { HORIZONTAL_LAYOUT_PADDINGS } from 'src/constants/suite/layout';

import { AssetFirstRow } from './AssetFirstRow';
import { ASSET_FIRST_CELL_PADDING } from './assetFirstTableUtils';

/**
 * The rows run the full width of the page rather than sitting in a card: the design separates
 * assets by a line across the page, so the table escapes the content padding and each outer cell
 * puts it back, which keeps the text aligned with the balance above it.
 */
const FullWidthTable = styled.div`
    margin: 0 calc(-1 * ${HORIZONTAL_LAYOUT_PADDINGS});
    background: ${({ theme }) => theme.surfaceFillRaised};
    border-top: 1px solid ${({ theme }) => theme.borderNeutral};
`;

/**
 * The dashboard's assets, one row per asset and network.
 *
 * Where `AssetsView` shows a network and folds what it holds into it, this shows what the wallet
 * holds and says which network each holding is on — so Ether on Ethereum and Ether on Arbitrum are
 * two lines, and a stablecoin held on three networks is three.
 *
 * Behind the `asset-first-home-table` experimental feature.
 */
type AssetFirstTableProps = {
    assetKeys: readonly AssetKey[];
};

export const AssetFirstTable = ({ assetKeys }: AssetFirstTableProps) => {
    if (assetKeys.length === 0) {
        return null;
    }

    return (
        <FullWidthTable data-testid="@dashboard/asset-first-table">
            <Table isRowHighlightedOnHover colWidths={[{ minWidth: '200px' }, {}, {}]}>
                <Table.Header>
                    <Table.Row>
                        <Table.Cell padding={ASSET_FIRST_CELL_PADDING.first}>
                            <Translation id="TR_ASSET" />
                        </Table.Cell>
                        <Table.Cell align="end">
                            <Translation id="TR_EXCHANGE_RATE" />
                        </Table.Cell>
                        <Table.Cell align="end" padding={ASSET_FIRST_CELL_PADDING.last}>
                            <Translation id="TR_BALANCE" />
                        </Table.Cell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {assetKeys.map(assetKey => (
                        <AssetFirstRow key={assetKey} assetKey={assetKey} />
                    ))}
                </Table.Body>
            </Table>
        </FullWidthTable>
    );
};
