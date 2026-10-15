import { memo } from 'react';

import { Translation } from '@suite/intl';
import { type NftItem } from '@suite-common/assets';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { Badge, IconCircle, Row, Table, Text } from '@trezor/components';
import { PictureFrameIcon } from '@trezor/icons';

import { NFT_ITEM_ICON_SIZE } from './homeAssetNftLayout';
import { HOME_ASSET_CELL_PADDING } from '../HomeAssetsTable/homeAssetTableLayout';

type HomeAssetNftItemRowProps = {
    assetKey: WalletAssetKey;
    item: NftItem;
};

export const HomeAssetNftItemRow = memo(
    ({ assetKey, item: { id, amount } }: HomeAssetNftItemRowProps) => (
        <Table.Row
            hasBorderTop={false}
            isHighlightedOnHover={false}
            data-testid={`@dashboard/home-asset-nft-item/${assetKey}/${id}`}
        >
            <Table.Cell colSpan={2} maxWidth="100%" padding={HOME_ASSET_CELL_PADDING.first}>
                <Row gap={12}>
                    <IconCircle
                        icon={PictureFrameIcon}
                        size={NFT_ITEM_ICON_SIZE}
                        intent="neutral"
                    />
                    <Text
                        typographyStyle="body-sm"
                        intent="neutral"
                        priority="secondary"
                        ellipsisLineCount={1}
                    >
                        #{id}
                    </Text>
                    <Badge size="small">{amount}×</Badge>
                </Row>
            </Table.Cell>
        </Table.Row>
    ),
);

HomeAssetNftItemRow.displayName = 'HomeAssetNftItemRow';

type HomeAssetNftMoreItemsRowProps = {
    count: number;
};

export const HomeAssetNftMoreItemsRow = ({ count }: HomeAssetNftMoreItemsRowProps) => (
    <Table.Row hasBorderTop={false} isHighlightedOnHover={false}>
        <Table.Cell colSpan={2} padding={HOME_ASSET_CELL_PADDING.first}>
            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                <Translation id="TR_HOME_ASSET_NFT_MORE_ITEMS" values={{ count }} />
            </Text>
        </Table.Cell>
    </Table.Row>
);
