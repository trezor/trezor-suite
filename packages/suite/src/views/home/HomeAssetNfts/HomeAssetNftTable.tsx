import { useState } from 'react';

import { Translation } from '@suite/intl';
import { selectHiddenNftCollectionKeys, selectShownNftCollectionKeys } from '@suite-common/assets';
import { Table } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

import { HomeAssetNftRow } from './HomeAssetNftRow';
import { HomeAssetExpandRow } from '../HomeAssetsTable/HomeAssetExpandRow';
import { HOME_ASSET_CELL_PADDING } from '../HomeAssetsTable/homeAssetTableLayout';

const NFT_COL_WIDTHS = [{ minWidth: '200px' }, { width: '25%' }];

// Airdropped spam can fill the hidden tab with thousands of collections; each row subscribes to
// the store, so they mount a page at a time.
const NFT_ROWS_PAGE = 50;

type HomeAssetNftTableProps = {
    isHidden: boolean;
};

export const HomeAssetNftTable = ({ isHidden }: HomeAssetNftTableProps) => {
    const assetKeys = useSelector(
        isHidden ? selectHiddenNftCollectionKeys : selectShownNftCollectionKeys,
    );
    const [rowLimit, setRowLimit] = useState(NFT_ROWS_PAGE);

    const isFullyShown = rowLimit >= assetKeys.length;

    return (
        <Table isRowHighlightedOnHover colWidths={NFT_COL_WIDTHS}>
            <Table.Header>
                <Table.Row>
                    <Table.Cell padding={HOME_ASSET_CELL_PADDING.first}>
                        <Translation id="TR_HOME_ASSET_NFT_COLLECTION" />
                    </Table.Cell>
                    <Table.Cell align="end" padding={HOME_ASSET_CELL_PADDING.last}>
                        <Translation id="TR_NETWORK_TITLE" />
                    </Table.Cell>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {assetKeys.slice(0, rowLimit).map(assetKey => (
                    <HomeAssetNftRow key={assetKey} assetKey={assetKey} isHidden={isHidden} />
                ))}
                {assetKeys.length > NFT_ROWS_PAGE && (
                    <HomeAssetExpandRow
                        isExpanded={isFullyShown}
                        onToggle={() =>
                            setRowLimit(isFullyShown ? NFT_ROWS_PAGE : rowLimit + NFT_ROWS_PAGE)
                        }
                    />
                )}
            </Table.Body>
        </Table>
    );
};
