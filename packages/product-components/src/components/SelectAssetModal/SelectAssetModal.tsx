import { ReactNode, useState } from 'react';
import { useIntl } from 'react-intl';

import { Column, NewModal, useScrollShadow, VirtualizedList } from '@trezor/components';
import { mapElevationToBackgroundToken, spacings } from '@trezor/theme';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { AssetItem } from './AssetItem';
import { AssetItemNotFound } from './AssetItemNotFound';

export interface AssetProps {
    ticker: string;
    badge?: ReactNode;
    symbolExtended: NetworkSymbol | (string & {});
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
}

export const SelectAssetModal = ({
    options,
    onSelectAsset,
    onClose,
    filterTabs,
    searchInput,
    noItemsAvailablePlaceholder,
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
            <Column gap={spacings.md} alignItems="stretch">
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
                                symbolExtended,
                                badge,
                                contractAddress,
                                shouldTryToFetch,
                            }: AssetProps) => (
                                <AssetItem
                                    key={`${symbolExtended}${contractAddress ? `-${contractAddress}` : ''}`}
                                    cryptoName={cryptoName}
                                    ticker={ticker}
                                    coingeckoId={coingeckoId}
                                    contractAddress={contractAddress || null}
                                    symbolExtended={symbolExtended}
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
