import { memo } from 'react';

import { Translation } from '@suite/intl';
import { selectNftCollection } from '@suite-common/assets';
import { useFormatters } from '@suite-common/formatters';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { Badge, Icon, Row, Table, Text } from '@trezor/components';
import { CaretDownIcon, CaretRightIcon } from '@trezor/icons';
import { NetworkIcon } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';
import { BlurUrls } from 'src/views/wallet/tokens/common/BlurUrls';

import { HOME_ASSET_CELL_PADDING } from '../HomeAssetsTable/homeAssetTableLayout';

type HomeAssetNftRowProps = {
    assetKey: WalletAssetKey;
    isHidden: boolean;
    isOpen: boolean;
    onToggle: (assetKey: WalletAssetKey) => void;
};

export const HomeAssetNftRow = memo(
    ({ assetKey, isHidden, isOpen, onToggle }: HomeAssetNftRowProps) => {
        const collection = useSelector(state => selectNftCollection(state, assetKey, isHidden));
        const { NetworkNameFormatter } = useFormatters();

        if (collection === undefined) {
            return null;
        }

        const { name, symbol, itemCount, hasListedItems } = collection;

        return (
            <Table.Row
                hasBorderTop={false}
                onClick={hasListedItems ? () => onToggle(assetKey) : undefined}
                data-testid={`@dashboard/home-asset-nft/${assetKey}`}
            >
                <Table.Cell padding={HOME_ASSET_CELL_PADDING.first}>
                    <Row gap={8}>
                        {hasListedItems && (
                            <Icon
                                as={isOpen ? CaretDownIcon : CaretRightIcon}
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
                                values={{ count: itemCount }}
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
        );
    },
);

HomeAssetNftRow.displayName = 'HomeAssetNftRow';
