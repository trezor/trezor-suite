import { memo, useState } from 'react';

import { Translation } from '@suite/intl';
import {
    selectNftCollectionHasListedItems,
    selectNftCollectionItemCount,
    selectNftCollectionName,
    selectNftCollectionSymbol,
} from '@suite-common/assets';
import { useFormatters } from '@suite-common/formatters';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { Badge, Icon, Row, Table, Text } from '@trezor/components';
import { CaretDownIcon, CaretRightIcon } from '@trezor/icons';
import { NetworkIcon } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';
import { BlurUrls } from 'src/views/wallet/tokens/common/BlurUrls';

import { HomeAssetNftItems } from './HomeAssetNftItems';
import { HOME_ASSET_CELL_PADDING } from '../HomeAssetsTable/homeAssetTableLayout';

type HomeAssetNftRowProps = {
    assetKey: WalletAssetKey;
    isHidden: boolean;
};

export const HomeAssetNftRow = memo(function HomeAssetNftRow({
    assetKey,
    isHidden,
}: HomeAssetNftRowProps) {
    const name = useSelector(state => selectNftCollectionName(state, assetKey, isHidden));
    const symbol = useSelector(state => selectNftCollectionSymbol(state, assetKey, isHidden));
    const itemCount = useSelector(state => selectNftCollectionItemCount(state, assetKey, isHidden));
    const hasListedItems = useSelector(state =>
        selectNftCollectionHasListedItems(state, assetKey, isHidden),
    );
    const [areItemsShown, setAreItemsShown] = useState(false);
    const { NetworkNameFormatter } = useFormatters();

    if (name === undefined || symbol === undefined) {
        return null;
    }

    return (
        <>
            <Table.Row
                onClick={hasListedItems ? () => setAreItemsShown(isShown => !isShown) : undefined}
                data-testid={`@dashboard/home-asset-nft/${assetKey}`}
            >
                <Table.Cell padding={HOME_ASSET_CELL_PADDING.first}>
                    <Row gap={8}>
                        {hasListedItems && (
                            <Icon
                                as={areItemsShown ? CaretDownIcon : CaretRightIcon}
                                size={16}
                                intent="neutral"
                                priority="secondary"
                            />
                        )}
                        <Text typographyStyle="body-md" ellipsisLineCount={1}>
                            <BlurUrls text={name} />
                        </Text>
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            <Translation
                                id="TR_HOME_ASSET_NFT_ITEMS"
                                values={{ count: itemCount ?? 0 }}
                            />
                        </Text>
                    </Row>
                </Table.Cell>

                <Table.Cell align="end" padding={HOME_ASSET_CELL_PADDING.last}>
                    <Badge size="small">
                        <Row gap={6}>
                            <NetworkIcon networkSymbol={symbol} size={16} />
                            <NetworkNameFormatter value={symbol} />
                        </Row>
                    </Badge>
                </Table.Cell>
            </Table.Row>

            {areItemsShown && <HomeAssetNftItems assetKey={assetKey} isHidden={isHidden} />}
        </>
    );
});
