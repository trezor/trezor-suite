import { memo } from 'react';

import { Translation } from '@suite/intl';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { Badge, IconCircle, Row, Table, Text } from '@trezor/components';
import { PictureFrameIcon } from '@trezor/icons';

import { NFT_CELL_PADDING, NFT_ITEM_ICON_SIZE } from './nftLayout';
import { type NftItem } from '../nftSelectors';

type NftItemRowProps = {
    assetKey: WalletAssetKey;
    item: NftItem;
};

export const NftItemRow = memo(({ assetKey, item: { id, amount } }: NftItemRowProps) => (
    <Table.Row
        hasBorderTop={false}
        isHighlightedOnHover={false}
        data-testid={`@dashboard/home-asset-nft-item/${assetKey}/${id}`}
    >
        <Table.Cell colSpan={2} maxWidth="100%" padding={NFT_CELL_PADDING.first}>
            <Row gap={12}>
                <IconCircle icon={PictureFrameIcon} size={NFT_ITEM_ICON_SIZE} intent="neutral" />
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
));

NftItemRow.displayName = 'NftItemRow';

type NftMoreItemsRowProps = {
    count: number;
};

export const NftMoreItemsRow = ({ count }: NftMoreItemsRowProps) => (
    <Table.Row hasBorderTop={false} isHighlightedOnHover={false}>
        <Table.Cell colSpan={2} padding={NFT_CELL_PADDING.first}>
            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                <Translation id="TR_HOME_ASSET_NFT_MORE_ITEMS" values={{ count }} />
            </Text>
        </Table.Cell>
    </Table.Row>
);
