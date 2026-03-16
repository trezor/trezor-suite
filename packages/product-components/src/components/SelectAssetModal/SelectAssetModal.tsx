import { type ReactNode, useCallback, useState } from 'react';
import { useIntl } from 'react-intl';

import type { NetworkSymbolExtended } from '@suite-common/wallet-config';
import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { Column, Modal, VirtualizedList, useScrollShadow } from '@trezor/components';
import { mapElevationToBackgroundToken, spacings } from '@trezor/theme';

import { AssetItem } from './AssetItem';
import { AssetItemNotFound } from './AssetItemNotFound';

export interface AssetTokenBalance {
    baseSymbol?: string; // TokenInfo['symbol'];
    baseAmount: string;
    fiatAmount: BaseCurrencyAmount | null;
}

export interface AssetProps {
    ticker: string;
    badge?: ReactNode;
    symbol: NetworkSymbolExtended;
    cryptoName?: string;
    coingeckoId?: string;
    contractAddress: string | null;
    height: number;
    shouldTryToFetch?: boolean;
    tokenBalance?: AssetTokenBalance;
}

export type AssetOptionBaseProps = Omit<AssetProps, 'height' | 'formattedBalance'>;

export const ITEM_HEIGHT = 60;
const LIST_MIN_HEIGHT = 200;
const HEADER_HEIGHT = 267;
const LIST_HEIGHT = `calc(80vh - ${HEADER_HEIGHT}px)`;

export interface SelectAssetModalProps {
    options: AssetProps[];
    onSelectAsset: (selectedAsset: AssetOptionBaseProps) => Promise<void> | void;
    onClose: () => void;
    searchInput?: ReactNode;
    filterTabs?: ReactNode;
    noItemsAvailablePlaceholder: { heading: ReactNode; body?: ReactNode };
    'data-testid'?: string;
    renderOptionBalance: (assetProps: AssetProps) => ReactNode;
}

export const SelectAssetModal = ({
    options,
    onSelectAsset,
    onClose,
    filterTabs,
    searchInput,
    noItemsAvailablePlaceholder,
    'data-testid': dataTestId,
}: SelectAssetModalProps) => {
    const intl = useIntl();

    const [end, setEnd] = useState(options.length);
    const { scrollElementRef, onScroll, ShadowTop, ShadowBottom, ShadowContainer } =
        useScrollShadow();

    const shadowColor = mapElevationToBackgroundToken({
        $elevation: 0,
    });

    const onScrollEnd = useCallback(() => {
        setEnd(end + 1000);
    }, [end]);

    const renderItem = useCallback(
        (option: AssetProps) => {
            const {
                cryptoName,
                ticker,
                coingeckoId,
                symbol,
                badge,
                contractAddress,
                shouldTryToFetch,
            } = option;

            return (
                <AssetItem
                    data-testid={`${dataTestId}/option/${cryptoName}-${symbol}`}
                    key={`${symbol}${contractAddress ? `-${contractAddress}` : ''}`}
                    cryptoName={cryptoName}
                    ticker={ticker}
                    coingeckoId={coingeckoId}
                    contractAddress={contractAddress || null}
                    symbol={symbol}
                    badge={badge}
                    shouldTryToFetch={shouldTryToFetch}
                    handleClick={onSelectAsset}
                />
            );
        },
        [dataTestId, onSelectAsset],
    );

    return (
        <Modal
            heading={intl.formatMessage({
                id: 'TR_SELECT_TOKEN',
                defaultMessage: 'Select a token',
            })}
            onCancel={onClose}
            width={600}
        >
            <Column gap={spacings.md}>
                {searchInput}

                {filterTabs}

                {options.length === 0 ? (
                    <AssetItemNotFound
                        listHeight={LIST_HEIGHT}
                        listMinHeight={LIST_MIN_HEIGHT}
                        noItemsAvailablePlaceholder={noItemsAvailablePlaceholder}
                    />
                ) : (
                    <ShadowContainer>
                        <ShadowTop backgroundColor={shadowColor} />
                        <VirtualizedList
                            items={options}
                            ref={scrollElementRef}
                            onScroll={onScroll}
                            renderItem={renderItem}
                            onScrollEnd={onScrollEnd}
                            listHeight={LIST_HEIGHT}
                            listMinHeight={LIST_MIN_HEIGHT}
                        />
                        <ShadowBottom backgroundColor={shadowColor} />
                    </ShadowContainer>
                )}
            </Column>
        </Modal>
    );
};
