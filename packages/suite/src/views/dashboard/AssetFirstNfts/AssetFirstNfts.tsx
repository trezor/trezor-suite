import { useState } from 'react';

import { Translation } from '@suite/intl';
import { Box, Card, Collapsible, Row, SubTabs, Table, Text } from '@trezor/components';
import { type StaticSessionId } from '@trezor/device-utils';

import { useSelector } from 'src/hooks/suite';

import { AssetFirstNftRow } from './AssetFirstNftRow';
import { selectDashboardNfts } from './assetFirstNftSelectors';
import { ASSET_FIRST_CELL_PADDING } from '../AssetFirstTable/assetFirstTableUtils';

type NftTab = 'collections' | 'hidden';

type AssetFirstNftsProps = {
    deviceState: StaticSessionId;
};

export const AssetFirstNfts = ({ deviceState }: AssetFirstNftsProps) => {
    const { shown, hidden } = useSelector(state => selectDashboardNfts(state, deviceState));
    const [tab, setTab] = useState<NftTab>('collections');

    if (shown.length === 0 && hidden.length === 0) {
        return null;
    }

    const collections = tab === 'hidden' ? hidden : shown;

    return (
        <Card paddingType="none" data-testid="@dashboard/asset-first-nfts">
            <Collapsible defaultIsOpen>
                <Collapsible.Toggle data-testid="@dashboard/asset-first-nfts/toggle">
                    {/* Collapsed, the section is this row and nothing else, so it carries the
                        padding the card would otherwise have and the bar stays as slim as it
                        reads. */}
                    <Row
                        justifyContent="space-between"
                        alignItems="center"
                        padding={{ vertical: 12, horizontal: 16 }}
                    >
                        <Row gap={8} alignItems="baseline">
                            <Text typographyStyle="body-md-strong">
                                <Translation id="TR_ASSET_FIRST_NFTS" />
                            </Text>
                            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                                <Translation
                                    id="TR_ASSET_FIRST_NFT_SUMMARY"
                                    values={{ collections: shown.length, hidden: hidden.length }}
                                />
                            </Text>
                        </Row>
                        <Collapsible.ToggleIcon size={16} />
                    </Row>
                </Collapsible.Toggle>

                <Collapsible.Content>
                    <Box padding={{ bottom: 16, horizontal: 16 }}>
                        <Row justifyContent="space-between" alignItems="center">
                            <SubTabs activeItemId={tab} size="small">
                                <SubTabs.Item
                                    id="collections"
                                    count={shown.length}
                                    onClick={() => setTab('collections')}
                                    data-testid="@dashboard/asset-first-nfts/collections"
                                >
                                    <Translation id="TR_COLLECTIONS" />
                                </SubTabs.Item>
                                <SubTabs.Item
                                    id="hidden"
                                    count={hidden.length}
                                    onClick={() => setTab('hidden')}
                                    data-testid="@dashboard/asset-first-nfts/hidden"
                                >
                                    <Translation id="TR_HIDDEN" />
                                </SubTabs.Item>
                            </SubTabs>
                            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                                <Translation id="TR_ASSET_FIRST_NFT_VIEW_ONLY" />
                            </Text>
                        </Row>

                        <Table
                            isRowHighlightedOnHover
                            margin={{ top: 16 }}
                            colWidths={[{ minWidth: '200px' }, {}]}
                        >
                            <Table.Header>
                                <Table.Row>
                                    <Table.Cell padding={ASSET_FIRST_CELL_PADDING.first}>
                                        <Translation id="TR_ASSET_FIRST_NFT_COLLECTION" />
                                    </Table.Cell>
                                    <Table.Cell align="end" padding={ASSET_FIRST_CELL_PADDING.last}>
                                        <Translation id="TR_ASSET_FIRST_NFT_NETWORK" />
                                    </Table.Cell>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {collections.map(collection => (
                                    <AssetFirstNftRow
                                        key={collection.collectionKey}
                                        collection={collection}
                                    />
                                ))}
                            </Table.Body>
                        </Table>
                    </Box>
                </Collapsible.Content>
            </Collapsible>
        </Card>
    );
};
