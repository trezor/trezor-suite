import { Translation } from '@suite/intl';
import { type AssetFiatBalance } from '@suite-common/assets';
import { type RatesByKey } from '@suite-common/wallet-types';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { Table } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { AssetRow } from './AssetRow';
import { AssetRowSkeleton } from './AssetRowSkeleton';
import { type AssetData } from '../AssetData';

interface AssetTableProps {
    discoveryInProgress?: boolean;
    assetsData: AssetData[];
    assetsFiatBalances: AssetFiatBalance[];
    baseCurrencyCode: BaseCurrencyCode;
    currentFiatRates?: RatesByKey;
}

export const AssetTable = ({
    discoveryInProgress,
    assetsData,
    assetsFiatBalances,
    baseCurrencyCode,
    currentFiatRates,
}: AssetTableProps) => (
    <Table
        isRowHighlightedOnHover
        margin={{ top: spacings.xs }}
        colWidths={[{ width: '48px' }, { minWidth: '130px', maxWidth: '200px' }]}
    >
        <Table.Header>
            <Table.Row>
                <Table.Cell></Table.Cell>
                <Table.Cell padding={{ left: spacings.zero }}>
                    <Translation id="TR_ASSETS" />
                </Table.Cell>
                <Table.Cell>
                    <Translation id="TR_VALUES" />
                </Table.Cell>
                <Table.Cell align="end">
                    <Translation id="TR_EXCHANGE_RATE" />
                </Table.Cell>
                <Table.Cell colSpan={3}>
                    <Translation id="TR_7D_CHANGE" />
                </Table.Cell>
            </Table.Row>
        </Table.Header>
        <Table.Body>
            {assetsData.map((asset, i) => (
                <AssetRow
                    key={asset.network.symbol + i}
                    network={asset.network}
                    failed={asset.failed}
                    assetNativeCryptoBalance={asset.assetNativeCryptoBalance}
                    assetTokens={asset.assetTokens}
                    stakingAccounts={asset.stakingAccounts}
                    assetsFiatBalances={assetsFiatBalances}
                    baseCurrencyCode={baseCurrencyCode}
                    currentFiatRates={currentFiatRates}
                    accounts={asset.accounts}
                    isStakeNetwork={asset.isStakeNetwork}
                />
            ))}
            {discoveryInProgress && <AssetRowSkeleton />}
        </Table.Body>
    </Table>
);
