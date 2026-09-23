import { useState } from 'react';

import { Translation } from '@suite/intl';
import { Badge, Icon, IconCircle, Row, Table, Text } from '@trezor/components';
import { CaretDownIcon, CaretRightIcon, PictureFrameIcon } from '@trezor/icons';
import { NetworkIcon } from '@trezor/product-components';

import { BlurUrls } from 'src/views/wallet/tokens/common/BlurUrls';

import { type NftCollection } from './assetFirstNftSelectors';
import { ASSET_FIRST_CELL_PADDING, getNetworkName } from '../AssetFirstTable/assetFirstTableUtils';

type AssetFirstNftRowProps = {
    collection: NftCollection;
};

export const AssetFirstNftRow = ({ collection }: AssetFirstNftRowProps) => {
    const [areItemsShown, setAreItemsShown] = useState(false);
    const { collectionKey, symbol, name, items } = collection;

    return (
        <>
            <Table.Row
                onClick={() => setAreItemsShown(shown => !shown)}
                data-testid={`@dashboard/asset-first-nft/${collectionKey}`}
            >
                <Table.Cell padding={ASSET_FIRST_CELL_PADDING.first}>
                    <Row gap={8}>
                        <Icon
                            as={areItemsShown ? CaretDownIcon : CaretRightIcon}
                            size={16}
                            intent="neutral"
                            priority="secondary"
                        />
                        <Text typographyStyle="body-md">
                            <BlurUrls text={name} />
                        </Text>
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            <Translation
                                id="TR_ASSET_FIRST_NFT_ITEMS"
                                values={{ count: items.length }}
                            />
                        </Text>
                    </Row>
                </Table.Cell>

                <Table.Cell align="end" padding={ASSET_FIRST_CELL_PADDING.last}>
                    <Badge size="small">
                        <Row gap={6}>
                            <NetworkIcon networkSymbol={symbol} size={16} />
                            {getNetworkName(symbol)}
                        </Row>
                    </Badge>
                </Table.Cell>
            </Table.Row>

            {items.map(item => (
                <Table.Row
                    key={`${collectionKey}/${item.id}`}
                    hasBorderTop={false}
                    isCollapsed={!areItemsShown}
                    data-testid={`@dashboard/asset-first-nft-item/${collectionKey}/${item.id}`}
                >
                    <Table.Cell
                        colSpan={2}
                        maxWidth="100%"
                        padding={ASSET_FIRST_CELL_PADDING.first}
                    >
                        <Row gap={12}>
                            <IconCircle icon={PictureFrameIcon} size={24} intent="neutral" />
                            <Text typographyStyle="body-md">
                                <BlurUrls text={name} />
                            </Text>
                            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                                #{item.id}
                            </Text>
                            <Badge size="small">{item.amount}x</Badge>
                        </Row>
                    </Table.Cell>
                </Table.Row>
            ))}
        </>
    );
};
