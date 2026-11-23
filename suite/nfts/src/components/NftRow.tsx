import { memo } from 'react';
import { useSelector } from 'react-redux';

import { HiddenPlaceholder } from '@suite/discreet-mode';
import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { Badge, Box, Icon, Link, Row, Text } from '@trezor/components';
import { ArrowUpRightIcon, CaretDownIcon, CaretRightIcon } from '@trezor/icons';
import { NetworkIcon } from '@trezor/product-components';

import { NFT_ROW_PADDING } from './NftItemRow';
import { NftUrlBlur } from './NftUrlBlur';
import {
    type NftHolding,
    type NftState,
    getNftCollection,
    getNftCollectionExplorerUrl,
    selectNftCollectionExplorer,
} from '../nftSelectors';

type NftRowProps = {
    assetKey: WalletAssetKey;
    /** The holdings of the list the row is in. */
    held: readonly NftHolding[];
    isOpen: boolean;
    onToggle: (assetKey: WalletAssetKey) => void;
};

export const NftRow = memo(({ assetKey, held, isOpen, onToggle }: NftRowProps) => {
    const collection = getNftCollection(held, assetKey);
    const explorerUrl = useSelector((state: NftState) =>
        getNftCollectionExplorerUrl(
            held,
            assetKey,
            selectNftCollectionExplorer(state, held, assetKey),
        ),
    );
    const { NetworkNameFormatter } = useFormatters();

    if (collection === undefined) {
        return null;
    }

    const { name, symbol, itemCount, hasListedItems } = collection;

    return (
        <Box
            onClick={hasListedItems ? () => onToggle(assetKey) : undefined}
            cursor={hasListedItems ? 'pointer' : 'default'}
            backgroundColorOnInteraction={hasListedItems ? 'elementFillGhostHovered' : undefined}
            data-testid={`@dashboard/home-asset-nft/${assetKey}`}
        >
            <Row
                justifyContent="space-between"
                alignItems="center"
                gap={16}
                padding={NFT_ROW_PADDING}
            >
                <Row gap={8} alignItems="center" flex="1" minWidth={0}>
                    {hasListedItems && (
                        <Icon
                            as={isOpen ? CaretDownIcon : CaretRightIcon}
                            size={16}
                            intent="neutral"
                            priority="secondary"
                        />
                    )}
                    <Text typographyStyle="body-md" ellipsisLineCount={1} minWidth={0}>
                        <NftUrlBlur text={name} />
                    </Text>
                    <Text
                        typographyStyle="body-sm"
                        intent="neutral"
                        priority="secondary"
                        textWrap="nowrap"
                    >
                        <HiddenPlaceholder>
                            <Translation
                                id="TR_HOME_ASSET_NFT_ITEMS"
                                values={{ count: itemCount }}
                            />
                        </HiddenPlaceholder>
                    </Text>
                </Row>
                <Row gap={8} alignItems="center">
                    <Badge size="small">
                        <Row gap={6}>
                            <NetworkIcon networkSymbol={symbol} size={16} />
                            <NetworkNameFormatter value={symbol} />
                        </Row>
                    </Badge>
                    {explorerUrl !== undefined && (
                        <Link
                            href={explorerUrl}
                            onClick={event => event.stopPropagation()}
                            data-testid={`@dashboard/home-asset-nft/${assetKey}/explorer`}
                        >
                            <Icon
                                as={ArrowUpRightIcon}
                                size={16}
                                intent="neutral"
                                priority="secondary"
                            />
                        </Link>
                    )}
                </Row>
            </Row>
        </Box>
    );
});

NftRow.displayName = 'NftRow';
