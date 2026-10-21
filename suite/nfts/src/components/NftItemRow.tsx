import { memo } from 'react';

import { HiddenPlaceholder, RedactNumericalValue } from '@suite/discreet-mode';
import { Translation } from '@suite/intl';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { Badge, IconCircle, type Padding, Row, Text } from '@trezor/components';
import { PictureFrameIcon } from '@trezor/icons';

import { type NftItem } from '../nftSelectors';

export const NFT_ITEM_ICON_SIZE = 24;

export const NFT_ROW_PADDING = { vertical: 12, horizontal: 20 } satisfies Padding;

type NftItemRowProps = {
    assetKey: WalletAssetKey;
    item: NftItem;
};

export const NftItemRow = memo(({ assetKey, item: { id, amount } }: NftItemRowProps) => (
    <Row
        gap={12}
        alignItems="center"
        padding={NFT_ROW_PADDING}
        data-testid={`@dashboard/home-asset-nft-item/${assetKey}/${id}`}
    >
        <IconCircle icon={PictureFrameIcon} size={NFT_ITEM_ICON_SIZE} intent="neutral" />
        <Text
            typographyStyle="body-sm"
            intent="neutral"
            priority="secondary"
            ellipsisLineCount={1}
            minWidth={0}
        >
            <HiddenPlaceholder>
                #<RedactNumericalValue value={id} />
            </HiddenPlaceholder>
        </Text>
        <Badge size="small">
            <HiddenPlaceholder>
                <RedactNumericalValue value={amount} />×
            </HiddenPlaceholder>
        </Badge>
    </Row>
));

NftItemRow.displayName = 'NftItemRow';

type NftMoreItemsRowProps = {
    count: number;
};

export const NftMoreItemsRow = ({ count }: NftMoreItemsRowProps) => (
    <Row padding={NFT_ROW_PADDING}>
        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
            <HiddenPlaceholder>
                <Translation id="TR_HOME_ASSET_NFT_MORE_ITEMS" values={{ count }} />
            </HiddenPlaceholder>
        </Text>
    </Row>
);
