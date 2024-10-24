import { useMemo, useState } from 'react';
import {
    AssetLogo,
    Column,
    Icon,
    Input,
    NewModal,
    useScrollShadow,
    VirtualizedList,
} from '@trezor/components';
import { mapElevationToBackgroundToken, spacings } from '@trezor/theme';
import { AssetItem } from './AssetItem';
import { NetworkTabs } from './NetworkTabs';
import { useIntl } from 'react-intl';
import { AssetItemNotFound } from './AssetItemNotFound';
import { getNetworkByCoingeckoId, Network, NetworkSymbol } from '@suite-common/wallet-config';
import { getContractAddressForNetwork } from '@suite-common/wallet-utils';

export interface SelectAssetOptionCurrencyProps {
    type: 'currency';
    symbol: string;
    balance?: string;
    networkSymbol: NetworkSymbol | ({} & string);
    cryptoName?: string | undefined;
    coingeckoId: string;
    contractAddress: string | null;
    networkName?: string;
    hidden?: boolean;
    unverified?: boolean;
    tokenExplorerUrl?: string;
}
export interface SelectAssetOptionGroupProps {
    type: 'group';
    label: string;
    networkName?: string;
    coingeckoId?: string;
}
export type SelectAssetOptionProps = SelectAssetOptionCurrencyProps | SelectAssetOptionGroupProps;

export interface SelectAssetNetworkProps {
    name: Network['name'];
    symbol: Network['symbol'];
    coingeckoId: Network['coingeckoId'];
    coingeckoNativeId?: Network['coingeckoNativeId'];
}

export type SelectAssetSearchCategoryType = {
    coingeckoId: string;
    coingeckoNativeId?: string;
} | null;

export interface SelectAssetModalProps {
    options: SelectAssetOptionProps[];
    networkCategories?: SelectAssetNetworkProps[]; //optional if used for choosing token for swapping in account
    onSelectAssetModal: (selectedAsset: SelectAssetOptionCurrencyProps) => void;
    onFavoriteClick?: (isFavorite: boolean) => void;
    onClose: () => void;
}

interface AssetProps
    extends Pick<SelectAssetOptionCurrencyProps, 'coingeckoId' | 'contractAddress'> {
    symbol: string;
    networkSymbol: NetworkSymbol | ({} & string);
    name: string | undefined;
    height: number;
    isFavorite: boolean;
    badge?: string;
}

const HEADER_HEIGHT = 267;
const ITEM_HEIGHT = 60;
const LIST_HEIGHT = `calc(80vh - ${HEADER_HEIGHT}px)`;
const LIST_MIN_HEIGHT = ITEM_HEIGHT * 3;

const getData = (options: SelectAssetOptionProps[]): AssetProps[] =>
    options
        .filter(item => item.type === 'currency')
        .map(item => ({
            symbol: item.symbol,
            networkSymbol: item.networkSymbol,
            name: item.cryptoName ?? item.symbol,
            badge: item.networkName,
            coingeckoId: item.coingeckoId,
            contractAddress: item.contractAddress,
            isFavorite: false,
            height: ITEM_HEIGHT,
        }));

const getNetworkCount = (options: SelectAssetOptionProps[]) => {
    const networkNetworkGroups = options
        .filter(item => item.type === 'group' && item.networkName)
        .map(networkGroup => ({
            ...networkGroup,
            coingeckoNativeId: networkGroup.coingeckoId
                ? getNetworkByCoingeckoId(networkGroup.coingeckoId)?.coingeckoNativeId
                : undefined,
        }));
    const networkCurrencies = options.filter(
        item =>
            item.type === 'currency' &&
            !item.contractAddress &&
            !networkNetworkGroups.find(
                group =>
                    group.coingeckoId === item.coingeckoId ||
                    group.coingeckoNativeId === item.coingeckoId,
            ),
    );

    return networkNetworkGroups.length + networkCurrencies.length;
};

export const SelectAssetModal = ({
    options,
    networkCategories,
    onSelectAssetModal,
    onFavoriteClick,
    onClose,
}: SelectAssetModalProps) => {
    const intl = useIntl();
    const [search, setSearch] = useState('');
    const [searchCategory, setSearchCategory] = useState<SelectAssetSearchCategoryType>(null); // coingeckoNativeId as fallback for ex. polygon
    const [end, setEnd] = useState(options.length);
    const data = useMemo(() => getData(options), [options]);
    const { scrollElementRef, onScroll, ShadowTop, ShadowBottom, ShadowContainer } =
        useScrollShadow();
    const networkCount = getNetworkCount(options);

    const filteredData = data.filter(item => {
        const categoryFilter = searchCategory
            ? item.coingeckoId === searchCategory.coingeckoId ||
              item.coingeckoId === searchCategory.coingeckoNativeId
            : true;
        const networkContractAddress = `${item.networkSymbol}${item.contractAddress ? `--${item.contractAddress}` : ''}`;
        const searchFor = (property: string | undefined) =>
            property?.toLocaleLowerCase().includes(search.toLocaleLowerCase());

        return (
            (searchFor(item.name) ||
                searchFor(item.badge) ||
                searchFor(item.symbol) ||
                searchFor(networkContractAddress)) &&
            categoryFilter
        );
    });

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
                <Input
                    placeholder={intl.formatMessage({
                        id: 'TR_SELECT_NAME_OR_ADDRESS',
                        defaultMessage: 'Search by name, symbol, network or contract address',
                    })}
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    autoFocus
                    onClear={() => {
                        setSearch('');
                        setSearchCategory(null);
                    }}
                    showClearButton="always"
                    innerAddon={<Icon name="search" variant="tertiary" size="medium" />}
                    innerAddonAlign="left"
                />
                {networkCategories && (
                    <NetworkTabs
                        networkCategories={networkCategories}
                        networkCount={networkCount}
                        searchCategory={searchCategory}
                        setSearchCategory={setSearchCategory}
                    />
                )}

                {filteredData.length === 0 ? (
                    <AssetItemNotFound
                        listHeight={LIST_HEIGHT}
                        listMinHeight={LIST_MIN_HEIGHT}
                        searchCategory={searchCategory}
                        networkCategories={networkCategories || []}
                    />
                ) : (
                    <ShadowContainer>
                        <ShadowTop backgroundColor={shadowColor} />
                        <VirtualizedList
                            items={filteredData}
                            ref={scrollElementRef}
                            onScroll={onScroll}
                            renderItem={({
                                name,
                                symbol,
                                coingeckoId,
                                networkSymbol,
                                isFavorite,
                                badge,
                                contractAddress,
                            }: AssetProps) => (
                                <AssetItem
                                    key={`${symbol}-${name}`}
                                    name={name}
                                    symbol={symbol as NetworkSymbol}
                                    coingeckoId={coingeckoId}
                                    contractAddress={contractAddress || null}
                                    networkSymbol={networkSymbol as NetworkSymbol}
                                    isFavorite={isFavorite}
                                    badge={badge}
                                    logo={
                                        <AssetLogo
                                            size={24}
                                            coingeckoId={coingeckoId}
                                            contractAddress={
                                                contractAddress !== null
                                                    ? getContractAddressForNetwork(
                                                          symbol as NetworkSymbol,
                                                          contractAddress,
                                                      )
                                                    : undefined
                                            }
                                            placeholder={symbol}
                                        />
                                    }
                                    handleClick={onSelectAssetModal}
                                    onFavoriteClick={onFavoriteClick}
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
