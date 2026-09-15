import { Translation } from '@suite/intl';
import { Card, LoadingContent, Table } from '@trezor/components';

import { DashboardSection } from 'src/components/dashboard';
import { useDiscovery, useSelector } from 'src/hooks/suite';

import { AssetFirstRow } from './AssetFirstRow';
import { selectAssetFirstTableKeys } from './assetFirstTableSelectors';

/**
 * The dashboard's assets, one row per asset and network.
 *
 * Where `AssetsView` shows a network and folds what it holds into it, this shows what the wallet
 * holds and says which network each holding is on — so Ether on Ethereum and Ether on Arbitrum are
 * two lines, and a stablecoin held on three networks is three.
 *
 * Behind the `asset-first-home-table` experimental feature.
 */
export const AssetFirstTable = () => {
    const assetKeys = useSelector(selectAssetFirstTableKeys);
    const { isDiscoveryRunning } = useDiscovery();

    if (assetKeys.length === 0) {
        return null;
    }

    return (
        <DashboardSection
            data-testid="@dashboard/asset-first-table"
            heading={
                <LoadingContent isLoading={isDiscoveryRunning}>
                    <Translation id="TR_MY_ASSETS" />
                </LoadingContent>
            }
        >
            <Card paddingType="none">
                <Table isRowHighlightedOnHover margin={{ top: 8 }}>
                    <Table.Header>
                        <Table.Row>
                            <Table.Cell>
                                <Translation id="TR_ASSET" />
                            </Table.Cell>
                            <Table.Cell align="end">
                                <Translation id="TR_EXCHANGE_RATE" />
                            </Table.Cell>
                            <Table.Cell align="end">
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
            </Card>
        </DashboardSection>
    );
};
