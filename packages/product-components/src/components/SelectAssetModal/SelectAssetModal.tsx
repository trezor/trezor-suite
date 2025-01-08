import { ReactNode, useState } from 'react';
import { useIntl } from 'react-intl';

import { Column, NewModal, useScrollShadow, VirtualizedList } from '@trezor/components';
import { mapElevationToBackgroundToken, spacings } from '@trezor/theme';
import type { NetworkSymbolExtended } from '@suite-common/wallet-config';

import { AssetItem } from './AssetItem';
import { AssetItemNotFound } from './AssetItemNotFound';

export interface AssetProps {
    ticker: string;
    badge?: ReactNode;
    symbol: NetworkSymbolExtended;
    cryptoName?: string;
    coingeckoId?: string;
    contractAddress: string | null;
    height: number;
    shouldTryToFetch?: boolean;
}

export type AssetOptionBaseProps = Omit<AssetProps, 'height'>;

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

    return (
        <NewModal
            heading={intl.formatMessage({
                id: 'TR_SELECT_TOKEN',
                defaultMessage: 'Select a token',
            })}
            onCancel={onClose}
            size="small"
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
                            renderItem={({
                                cryptoName,
                                ticker,
                                coingeckoId,
                                symbol,
                                badge,
                                contractAddress,
                                shouldTryToFetch,
                            }: AssetProps) => (
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
                            )}
                            onScrollEnd={() => {
                                setEnd(end + 1000);
                            }}
                            listHeight={LIST_HEIGHT}
                            listMinHeight={LIST_MIN_HEIGHT}
                        />
                        <ShadowBottom backgroundColor={shadowColor} />
                    </ShadowContainer>
                )}
            </Column>
        </NewModal>
    );
};
