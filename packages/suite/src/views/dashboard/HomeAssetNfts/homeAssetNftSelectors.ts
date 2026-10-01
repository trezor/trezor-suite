import { type SuiteSettingsRootState, selectIsNftSectionEnabled } from '@suite/settings';
import { type DeviceRootState } from '@suite-common/device';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import {
    type TokenDefinitionsRootState,
    selectTokenDefinitions,
} from '@suite-common/token-definitions';
import { type NetworkSymbol, getNetworkFeatures } from '@suite-common/wallet-config';
import {
    type AssetAccount,
    type AssetAccountsRootState,
    getTokens,
    selectCollectionsByDevice,
} from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { type StaticSessionId } from '@trezor/device-utils';

export type NftItem = {
    id: string;
    amount: number;
};

export type NftCollection = {
    collectionKey: string;
    symbol: NetworkSymbol;
    contract: TokenAddress;
    name: string;
    items: readonly NftItem[];
};

export type DashboardNfts = {
    shown: readonly NftCollection[];
    hidden: readonly NftCollection[];
};

export type HomeAssetNftsState = AssetAccountsRootState &
    DeviceRootState &
    TokenDefinitionsRootState &
    SuiteSettingsRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<HomeAssetNftsState>();

const EMPTY_NFTS: DashboardNfts = { shown: [], hidden: [] };

const getCollectionKey = (symbol: NetworkSymbol, contract: string) => `${symbol}/${contract}`;

const toItems = (collection: TokenInfo): NftItem[] => {
    const singleTokens = (collection.ids ?? []).map(id => ({ id, amount: 1 }));
    const multiTokens = (collection.multiTokenValues ?? []).map(({ id, value }) => ({
        id: id ?? '',
        amount: Number(value ?? 1),
    }));

    return [...singleTokens, ...multiTokens];
};

const gather = (gathered: Map<string, NftCollection>, assetAccount: AssetAccount) => {
    const { symbol, tokenInfo, contractAddress: contract } = assetAccount;

    if (tokenInfo === undefined || contract === undefined) {
        return;
    }

    const collectionKey = getCollectionKey(symbol, contract);
    const known = gathered.get(collectionKey);
    const items = toItems(tokenInfo);

    if (known === undefined) {
        gathered.set(collectionKey, {
            collectionKey,
            symbol,
            contract,
            name: tokenInfo.name ?? tokenInfo.symbol ?? contract,
            items,
        });

        return;
    }

    gathered.set(collectionKey, { ...known, items: [...known.items, ...items] });
};

const byName = (left: NftCollection, right: NftCollection) => left.name.localeCompare(right.name);

export const selectDashboardNfts = createMemoizedSelector(
    [
        selectCollectionsByDevice,
        selectTokenDefinitions,
        selectIsNftSectionEnabled,
        (_state: HomeAssetNftsState, deviceState: StaticSessionId) => deviceState,
    ],
    (collectionsByDevice, tokenDefinitions, isNftSectionEnabled, deviceState): DashboardNfts => {
        if (!isNftSectionEnabled) {
            return EMPTY_NFTS;
        }

        const shown = new Map<string, NftCollection>();
        const hidden = new Map<string, NftCollection>();

        collectionsByDevice.get(deviceState)?.forEach(assetAccount => {
            if (
                !assetAccount.isAccountVisible ||
                !getNetworkFeatures(assetAccount.symbol).includes('nfts')
            ) {
                return;
            }

            const { shownWithBalance } = getTokens({
                tokens: assetAccount.tokenInfo === undefined ? [] : [assetAccount.tokenInfo],
                symbol: assetAccount.symbol,
                tokenDefinitions: tokenDefinitions?.[assetAccount.symbol]?.nft,
                isNft: true,
                areCollectionsRecognisedByIds: true,
            });

            gather(shownWithBalance.length > 0 ? shown : hidden, assetAccount);
        });

        if (shown.size === 0 && hidden.size === 0) {
            return EMPTY_NFTS;
        }

        return {
            shown: returnStableArrayIfEmpty([...shown.values()].sort(byName)),
            hidden: returnStableArrayIfEmpty([...hidden.values()].sort(byName)),
        };
    },
);
