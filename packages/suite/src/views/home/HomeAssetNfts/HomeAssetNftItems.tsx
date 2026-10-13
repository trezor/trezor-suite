import { Translation } from '@suite/intl';
import { selectNftCollectionItems } from '@suite-common/assets';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { Badge, IconCircle, Row, Table, Text } from '@trezor/components';
import { PictureFrameIcon } from '@trezor/icons';

import { useSelector } from 'src/hooks/suite';

import { HOME_ASSET_CELL_PADDING } from '../HomeAssetsTable/homeAssetTableLayout';

// Spam collections can list thousands of items, and a row per item would all mount at once.
const NFT_ITEMS_LIMIT = 50;

type HomeAssetNftItemsProps = {
    assetKey: WalletAssetKey;
    isHidden: boolean;
};

export const HomeAssetNftItems = ({ assetKey, isHidden }: HomeAssetNftItemsProps) => {
    const items = useSelector(state => selectNftCollectionItems(state, assetKey, isHidden));

    if (items === undefined) {
        return null;
    }

    const notListedCount = items.length - NFT_ITEMS_LIMIT;

    return (
        <>
            {/* The same item can be held by two accounts of the wallet, so the id alone repeats. */}
            {items.slice(0, NFT_ITEMS_LIMIT).map(({ id, amount }, index) => (
                <Table.Row
                    key={`${index}/${id}`}
                    hasBorderTop={false}
                    data-testid={`@dashboard/home-asset-nft-item/${assetKey}/${id}`}
                >
                    <Table.Cell colSpan={2} maxWidth="100%" padding={HOME_ASSET_CELL_PADDING.first}>
                        <Row gap={12}>
                            <IconCircle icon={PictureFrameIcon} size={24} intent="neutral" />
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
            ))}
            {notListedCount > 0 && (
                <Table.Row hasBorderTop={false}>
                    <Table.Cell colSpan={2} padding={HOME_ASSET_CELL_PADDING.first}>
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            <Translation
                                id="TR_HOME_ASSET_NFT_MORE_ITEMS"
                                values={{ count: notListedCount }}
                            />
                        </Text>
                    </Table.Cell>
                </Table.Row>
            )}
        </>
    );
};
