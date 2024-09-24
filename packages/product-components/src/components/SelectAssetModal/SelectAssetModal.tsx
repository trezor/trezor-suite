import { useEffect, useState } from 'react';
import {
    AssetLogo,
    Button,
    Column,
    Icon,
    Input,
    NewModal,
    Row,
    useElevation,
    useScrollShadow,
    VirtualizedList,
    Text,
} from '@trezor/components';
import { mapElevationToBackgroundToken, spacings } from '@trezor/theme';
import { AssetItem } from './AssetItem';

const LIST_HEIGHT = '50vh';
const height = 60;

type Data = {
    id: number;
    symbol: string;
    name: string;
    height: number;
    isFavorite: boolean;
    badge: string;
};

const getData = (end: number, tokens: Array<string>): Array<Data> =>
    Array.from({ length: end }, (_, i) => ({
        id: i,
        symbol: `symbol ${i}`,
        name: `name ${i}`,
        badge: tokens[Math.floor(Math.random() * tokens.length)],
        isFavorite: Math.random() < 0.1,
        height,
    }));

export type SelectAssetModalProps = {
    onSelectAssetModal: (selectedAsset: string) => void;
    onFavoriteClick: (isFavorite: boolean) => void;
};

const tokens = ['ethereum', 'bitcoin', 'tether'];

export const SelectAssetModal = ({
    onSelectAssetModal,
    onFavoriteClick,
}: SelectAssetModalProps) => {
    const [search, setSearch] = useState('');
    const [end, setEnd] = useState(10000);
    const [data, setData] = useState(getData(end, tokens)); // @TODO
    const { scrollElementRef, onScroll, ShadowTop, ShadowBottom, ShadowContainer } =
        useScrollShadow();

    useEffect(() => {
        // simulate async data loading
        setTimeout(() => {
            setData(getData(end, tokens));
        }, 100);
    }, [end]);

    const filteredData = data.filter(
        item =>
            item.symbol.includes(search) ||
            item.name.includes(search) ||
            item.badge.includes(search),
    );

    const { parentElevation } = useElevation();

    const shadowColor = mapElevationToBackgroundToken({
        $elevation: parentElevation,
    });

    return (
        <NewModal heading="Select a token" onCancel={() => null} size="small">
            <Column gap={spacings.md} alignItems="stretch">
                <Input
                    placeholder="Search by name or symbol..."
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    autoFocus
                    onClear={() => setSearch('')}
                    showClearButton="always"
                    innerAddon={<Icon name="search" variant="tertiary" size="medium" />}
                    innerAddonAlign="left"
                />
                <Row gap={spacings.xs} flexWrap="wrap">
                    <Button
                        size="tiny"
                        variant="tertiary"
                        textWrap={false}
                        onClick={() => {
                            setSearch('');
                        }}
                    >
                        All networks (5)
                    </Button>
                    {tokens.map(token => (
                        <Button
                            size="tiny"
                            variant={search === token ? 'primary' : 'tertiary'}
                            onClick={() => {
                                setSearch(token);
                            }}
                        >
                            <Row gap={spacings.xs}>
                                <AssetLogo size={20} coingeckoId={token} placeholder="btc" />
                                {token}
                            </Row>
                        </Button>
                    ))}
                </Row>

                {filteredData.length === 0 ? (
                    <Column alignItems="center" justifyContent="center" height={LIST_HEIGHT}>
                        <Text variant="tertiary">no data</Text>
                    </Column>
                ) : (
                    <ShadowContainer>
                        <ShadowTop backgroundColor={shadowColor} />
                        <VirtualizedList
                            items={filteredData}
                            ref={scrollElementRef}
                            onScroll={onScroll}
                            renderItem={({ name, symbol, isFavorite, badge }) => (
                                <AssetItem
                                    key={`${symbol}-${name}`}
                                    name={name}
                                    symbol={symbol}
                                    isFavorite={isFavorite}
                                    badge={badge}
                                    handleClick={onSelectAssetModal}
                                    onFavoriteClick={onFavoriteClick}
                                />
                            )}
                            onScrollEnd={() => {
                                setEnd(end + 1000);
                            }}
                            height={LIST_HEIGHT}
                        />
                        <ShadowBottom backgroundColor={shadowColor} />
                    </ShadowContainer>
                )}
            </Column>
        </NewModal>
    );
};
