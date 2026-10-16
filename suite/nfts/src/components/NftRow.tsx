import { memo } from 'react';
import { shallowEqual, useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { Badge, Icon, Row, Table, Text } from '@trezor/components';
import { CaretDownIcon, CaretRightIcon } from '@trezor/icons';
import { NetworkIcon } from '@trezor/product-components';

import { NftUrlBlur } from './NftUrlBlur';
import { NFT_CELL_PADDING } from './nftLayout';
import { type NftState, selectNftCollection } from '../nftSelectors';

type NftRowProps = {
    assetKey: WalletAssetKey;
    isHidden: boolean;
    isOpen: boolean;
    onToggle: (assetKey: WalletAssetKey) => void;
};

export const NftRow = memo(({ assetKey, isHidden, isOpen, onToggle }: NftRowProps) => {
    const collection = useSelector(
        (state: NftState) => selectNftCollection(state, assetKey, isHidden),
        shallowEqual,
    );
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
            <Table.Cell padding={NFT_CELL_PADDING.first}>
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
                        <NftUrlBlur text={name} />
                    </Text>
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_HOME_ASSET_NFT_ITEMS" values={{ count: itemCount }} />
                    </Text>
                </Row>
            </Table.Cell>

            <Table.Cell align="end" padding={NFT_CELL_PADDING.last}>
                <Badge size="small">
                    <Row gap={6}>
                        <NetworkIcon networkSymbol={symbol} size={16} />
                        <NetworkNameFormatter value={symbol} />
                    </Row>
                </Badge>
            </Table.Cell>
        </Table.Row>
    );
});

NftRow.displayName = 'NftRow';
