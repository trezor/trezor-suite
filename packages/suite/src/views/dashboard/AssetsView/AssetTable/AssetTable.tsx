import { AssetRow } from './AssetRow';
import { AssetRowSkeleton } from './AssetRowSkeleton';
import { AssetTableRowPropsWithoutFiatBalances } from '../AssetsView';
import { Table } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { Translation } from 'src/components/suite';
import { AssetFiatBalance } from '@suite-common/assets';

interface AssetTableProps {
    discoveryInProgress?: boolean;
    assetsData: AssetTableRowPropsWithoutFiatBalances[];
    assetsFiatBalances: AssetFiatBalance[];
}

export const AssetTable = ({
    discoveryInProgress,
    assetsData,
    assetsFiatBalances,
}: AssetTableProps) => {
    return (
        <Table isRowHighlightedOnHover margin={{ top: spacings.md, bottom: spacings.md }}>
            <Table.Header>
                <Table.Row>
                    <Table.Cell colSpan={3}>
                        <Translation id="TR_ASSETS" />
                    </Table.Cell>
                    <Table.Cell>
                        <Translation id="TR_VALUES" />
                    </Table.Cell>
                    <Table.Cell>
                        <Translation id="TR_EXCHANGE_RATE" />
                    </Table.Cell>
                    <Table.Cell colSpan={3}>
                        <Translation id="TR_7D_CHANGE" />
                    </Table.Cell>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {assetsData.map((asset, i) => (
                    <>
                        <AssetRow
                            key={asset.network.symbol + i}
                            network={asset.network}
                            failed={asset.failed}
                            assetNativeCryptoBalance={asset.assetNativeCryptoBalance}
                            assetTokens={asset.assetTokens}
                            stakingAccounts={asset.stakingAccounts}
                            assetsFiatBalances={assetsFiatBalances}
                        />
                    </>
                ))}
                {discoveryInProgress && <AssetRowSkeleton />}
            </Table.Body>
        </Table>
    );
};
