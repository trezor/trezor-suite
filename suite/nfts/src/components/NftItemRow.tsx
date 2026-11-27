import { memo } from 'react';

import { HiddenPlaceholder, RedactNumericalValue } from '@suite/discreet-mode';
import { Translation } from '@suite/intl';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { Badge, IconButton, IconCircle, Link, type Padding, Row, Text } from '@trezor/components';
import { ArrowUpIcon, PictureFrameIcon } from '@trezor/icons';

import { type NftItem } from '../nftSelectors';

export const NFT_ITEM_ICON_SIZE = 24;

// A small IconButton: 16px icon plus 6px padding on each side.
export const NFT_ITEM_SEND_BUTTON_SIZE = 28;

export const NFT_ROW_PADDING = { vertical: 12, horizontal: 20 } satisfies Padding;

type NftItemRowProps = {
    assetKey: WalletAssetKey;
    item: NftItem;
    onSend?: (item: NftItem) => void;
};

export const NftItemRow = memo(({ assetKey, item, onSend }: NftItemRowProps) => {
    const { id, amount, explorerUrl } = item;
    const itemId = (
        <HiddenPlaceholder>
            #<RedactNumericalValue value={id} />
        </HiddenPlaceholder>
    );

    return (
        <Row
            gap={12}
            alignItems="center"
            justifyContent="space-between"
            padding={NFT_ROW_PADDING}
            data-testid={`@dashboard/home-asset-nft-item/${assetKey}/${id}`}
        >
            <Row gap={12} alignItems="center" minWidth={0}>
                <IconCircle icon={PictureFrameIcon} size={NFT_ITEM_ICON_SIZE} intent="neutral" />
                <Text
                    typographyStyle="body-sm"
                    intent="neutral"
                    priority="secondary"
                    ellipsisLineCount={1}
                    minWidth={0}
                >
                    {explorerUrl === undefined ? itemId : <Link href={explorerUrl}>{itemId}</Link>}
                </Text>
                <Badge size="small">
                    <HiddenPlaceholder>
                        <RedactNumericalValue value={amount} />×
                    </HiddenPlaceholder>
                </Badge>
            </Row>
            {onSend && (
                <IconButton
                    icon={ArrowUpIcon}
                    size="small"
                    intent="neutral"
                    priority="secondary"
                    onClick={() => onSend(item)}
                    tooltip={{ content: <Translation id="TR_NAV_SEND" /> }}
                    data-testid={`@dashboard/home-asset-nft-item/${assetKey}/${id}/send`}
                />
            )}
        </Row>
    );
});

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
