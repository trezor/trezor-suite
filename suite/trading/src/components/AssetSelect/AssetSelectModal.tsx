import { useState } from 'react';

import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import { type TradingAssetOption } from '@suite-common/trading';
import { CardList, Column, Icon, Input, Modal, Paragraph, Row, Text } from '@trezor/components';
import { MagnifyingGlassIcon } from '@trezor/icons';

import { AssetLabel } from './AssetLabel';

const isAssetMatchingSearch = (asset: TradingAssetOption, search: string) =>
    [asset.name, asset.displaySymbol, asset.networkName].some(text =>
        text.toLowerCase().includes(search),
    );

type AssetSelectModalProps = {
    options: TradingAssetOption[];
    heading: TranslationKey;
    onSelect: (asset: TradingAssetOption) => void;
    onClose: () => void;
};

// TEMPORARY(POC): plain list with a simple search. The real asset picker (virtualized list, network
// filter, balances, ownership ordering) lives in packages/suite/src/components/suite/asset-picker and
// cannot be imported into @suite/trading until it moves to a shared package.
export const AssetSelectModal = ({
    options,
    heading,
    onSelect,
    onClose,
}: AssetSelectModalProps) => {
    const { translationString } = useTranslation();
    const [search, setSearch] = useState('');

    const normalizedSearch = search.trim().toLowerCase();
    const filteredOptions = normalizedSearch
        ? options.filter(asset => isAssetMatchingSearch(asset, normalizedSearch))
        : options;

    const handleSelect = (asset: TradingAssetOption) => {
        onSelect(asset);
        onClose();
    };

    return (
        <Modal
            width={480}
            maxHeight={680}
            onCancel={onClose}
            heading={<Translation id={heading} />}
        >
            <Column gap={12} height="100%">
                <Input
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    onClear={() => setSearch('')}
                    showClearButton
                    placeholder={translationString('TR_ASSET_PICKER_SEARCH_PLACEHOLDER')}
                    leftContent={
                        <Icon
                            as={MagnifyingGlassIcon}
                            intent="neutral"
                            priority="secondary"
                            size={16}
                        />
                    }
                    data-testid="@asset-picker/search/input"
                />
                {filteredOptions.length > 0 ? (
                    <CardList>
                        {filteredOptions.map(asset => (
                            <CardList.Item
                                key={asset.id}
                                onClick={() => handleSelect(asset)}
                                data-testid={`@asset-picker/buy/option/asset/${asset.id}`}
                            >
                                <Row gap={16} justifyContent="space-between" alignItems="center">
                                    <AssetLabel asset={asset} />
                                    <Text
                                        typographyStyle="body-sm"
                                        intent="neutral"
                                        priority="secondary"
                                    >
                                        {asset.networkName}
                                    </Text>
                                </Row>
                            </CardList.Item>
                        ))}
                    </CardList>
                ) : (
                    <Column justifyContent="center" flex="0.75">
                        <Paragraph align="center">
                            <Translation id="TR_ASSET_PICKER_SEARCH_NO_RESULTS" />
                        </Paragraph>
                        <Paragraph
                            align="center"
                            typographyStyle="body-sm"
                            color="contentSecondary"
                        >
                            <Translation id="TR_ASSET_PICKER_SEARCH_NO_RESULTS_DESCRIPTION" />
                        </Paragraph>
                    </Column>
                )}
            </Column>
        </Modal>
    );
};
