import { useState } from 'react';

import { Translation } from '@suite/intl';
import { Box, Card, Collapsible, Row, SubTabs, Table, Text } from '@trezor/components';
import { type StaticSessionId } from '@trezor/device-utils';

import { useSelector } from 'src/hooks/suite';

import { HomeAssetNftRow } from './HomeAssetNftRow';
import { selectDashboardNfts } from './homeAssetNftSelectors';
import { HOME_ASSET_CELL_PADDING } from '../HomeAssetTable/homeAssetTableUtils';

type NftTab = 'collections' | 'hidden';

type HomeAssetNftsProps = {
    deviceState: StaticSessionId;
};

export const HomeAssetNfts = ({ deviceState }: HomeAssetNftsProps) => {
    const { shown, hidden } = useSelector(state => selectDashboardNfts(state, deviceState));
    const [tab, setTab] = useState<NftTab>('collections');

    if (shown.length === 0 && hidden.length === 0) {
        return null;
    }

    const collections = tab === 'hidden' ? hidden : shown;

    return (
        <Card paddingType="none" data-testid="@dashboard/home-asset-nfts">
            <Collapsible defaultIsOpen>
                <Collapsible.Toggle data-testid="@dashboard/home-asset-nfts/toggle">
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
                                <Translation id="TR_HOME_ASSET_NFTS" />
                            </Text>
                            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                                <Translation
                                    id="TR_HOME_ASSET_NFT_SUMMARY"
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
                                    data-testid="@dashboard/home-asset-nfts/collections"
                                >
                                    <Translation id="TR_COLLECTIONS" />
                                </SubTabs.Item>
                                <SubTabs.Item
                                    id="hidden"
                                    count={hidden.length}
                                    onClick={() => setTab('hidden')}
                                    data-testid="@dashboard/home-asset-nfts/hidden"
                                >
                                    <Translation id="TR_HIDDEN" />
                                </SubTabs.Item>
                            </SubTabs>
                            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                                <Translation id="TR_HOME_ASSET_NFT_VIEW_ONLY" />
                            </Text>
                        </Row>

                        <Table
                            isRowHighlightedOnHover
                            margin={{ top: 16 }}
                            colWidths={[{ minWidth: '200px' }, {}]}
                        >
                            <Table.Header>
                                <Table.Row>
                                    <Table.Cell padding={HOME_ASSET_CELL_PADDING.first}>
                                        <Translation id="TR_HOME_ASSET_NFT_COLLECTION" />
                                    </Table.Cell>
                                    <Table.Cell align="end" padding={HOME_ASSET_CELL_PADDING.last}>
                                        <Translation id="TR_HOME_ASSET_NFT_NETWORK" />
                                    </Table.Cell>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {collections.map(collection => (
                                    <HomeAssetNftRow
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
