import { type DeviceRootState } from '@suite-common/device';
import {
    DefinitionType,
    type TokenDefinitionsRootState,
    type TokenDefinitionsState,
    selectTokenDefinitions,
} from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { isNftToken } from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { type StaticSessionId } from '@trezor/device-utils';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';
import { type Branded } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import { type AccountsRootState } from './accountsReducer';
import { selectAccounts, selectVisibleDeviceAccounts } from './accountsSelectors';
import { getTokens } from '../tokens/tokenUtils';

export type WalletAssetKey = string & Branded<'WalletAssetKey'>;

export type AssetAccountKey = string & Branded<'AssetAccountKey'>;

const ASSET_KEY_SEPARATOR = '/';

const NATIVE_COIN_CONTRACT = '';

type WalletAssetKeyParams = {
    deviceState: StaticSessionId;
    symbol: NetworkSymbol;
    contractAddress?: TokenAddress;
};

export const getWalletAssetKey = ({
    deviceState,
    symbol,
    contractAddress,
}: WalletAssetKeyParams): WalletAssetKey =>
    [deviceState, symbol, contractAddress ?? NATIVE_COIN_CONTRACT].join(
        ASSET_KEY_SEPARATOR,
    ) as WalletAssetKey;

type AssetAccountKeyParams = {
    accountKey: AccountKey;
    contractAddress: TokenAddress | undefined;
};

const getAssetAccountKey = ({
    accountKey,
    contractAddress,
}: AssetAccountKeyParams): AssetAccountKey =>
    [accountKey, contractAddress ?? NATIVE_COIN_CONTRACT].join(
        ASSET_KEY_SEPARATOR,
    ) as AssetAccountKey;

export type AssetAccount = {
    assetAccountKey: AssetAccountKey;
    accountKey: AccountKey;
    assetKey: WalletAssetKey;
    deviceState: StaticSessionId;
    symbol: NetworkSymbol;
    contractAddress: TokenAddress | undefined;
    cryptoBalance: string;
    tokenInfo: TokenInfo | undefined;
};

type ToAssetAccountParams = {
    account: Account;
    contractAddress: TokenAddress | undefined;
    cryptoBalance: string;
    tokenInfo: TokenInfo | undefined;
};

const toAssetAccount = ({
    account,
    contractAddress,
    cryptoBalance,
    tokenInfo,
}: ToAssetAccountParams): AssetAccount => ({
    assetAccountKey: getAssetAccountKey({ accountKey: account.key, contractAddress }),
    accountKey: account.key,
    assetKey: getWalletAssetKey({
        deviceState: account.deviceState,
        symbol: account.symbol,
        contractAddress,
    }),
    deviceState: account.deviceState,
    symbol: account.symbol,
    contractAddress,
    cryptoBalance,
    tokenInfo,
});

const hasBalance = (token: TokenInfo) => new BigNumber(token.balance ?? '0').gt(0);

// A collection is held when it lists its items, even where the backend reports no balance for it.
const isNftHeld = (token: TokenInfo) =>
    (token.ids?.length ?? 0) > 0 || (token.multiTokenValues?.length ?? 0) > 0 || hasBalance(token);

type AssetAccountsByKind = {
    assetAccounts: readonly AssetAccount[];
    nftAssetAccounts: readonly AssetAccount[];
};

/** One walk over the accounts' tokens for both kinds, so a token-heavy wallet pays for it once. */
const splitAssetAccounts = (accounts: readonly Account[]): AssetAccountsByKind => {
    const assetAccounts: AssetAccount[] = [];
    const nftAssetAccounts: AssetAccount[] = [];

    accounts.forEach(account => {
        assetAccounts.push(
            toAssetAccount({
                account,
                contractAddress: undefined,
                cryptoBalance: account.formattedBalance,
                tokenInfo: undefined,
            }),
        );

        (account.tokens ?? []).forEach(token => {
            const isNft = isNftToken(token);
            const isHeld = isNft ? isNftHeld(token) : hasBalance(token);

            if (!isHeld) {
                return;
            }

            const bucket = isNft ? nftAssetAccounts : assetAccounts;

            bucket.push(
                toAssetAccount({
                    account,
                    contractAddress: token.contract as TokenAddress,
                    cryptoBalance: token.balance ?? '0',
                    tokenInfo: token,
                }),
            );
        });
    });

    return {
        assetAccounts: returnStableArrayIfEmpty(assetAccounts),
        nftAssetAccounts: returnStableArrayIfEmpty(nftAssetAccounts),
    };
};

export type AssetAccountsRootState = AccountsRootState &
    DeviceRootState &
    TokenDefinitionsRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<AssetAccountsRootState>();

const selectAssetAccountsByKind = createMemoizedSelector([selectAccounts], splitAssetAccounts);

/** Only the wallet on screen: another wallet's accounts are no work this table has to do. */
const selectDeviceAssetAccountsByKind = createMemoizedSelector(
    [selectVisibleDeviceAccounts],
    splitAssetAccounts,
);

export const selectAssetAccounts = createMemoizedSelector(
    [selectAssetAccountsByKind],
    ({ assetAccounts }) => assetAccounts,
);

export const selectDeviceAssetAccounts = createMemoizedSelector(
    [selectDeviceAssetAccountsByKind],
    ({ assetAccounts }) => assetAccounts,
);

export const selectDeviceNftAssetAccounts = createMemoizedSelector(
    [selectDeviceAssetAccountsByKind],
    ({ nftAssetAccounts }) => nftAssetAccounts,
);

type AssetAccountsByContract = ReadonlyMap<TokenAddress, readonly AssetAccount[]>;

type AssetAccountsByToken = ReadonlyMap<NetworkSymbol, AssetAccountsByContract>;

const groupAssetAccountsByToken = (
    assetAccounts: readonly AssetAccount[],
): AssetAccountsByToken => {
    const byNetwork = new Map<NetworkSymbol, Map<TokenAddress, AssetAccount[]>>();

    assetAccounts.forEach(assetAccount => {
        const { symbol, contractAddress } = assetAccount;

        if (contractAddress === undefined) {
            return;
        }

        let byContract = byNetwork.get(symbol);

        if (byContract === undefined) {
            byContract = new Map<TokenAddress, AssetAccount[]>();
            byNetwork.set(symbol, byContract);
        }

        const held = byContract.get(contractAddress);

        if (held === undefined) {
            byContract.set(contractAddress, [assetAccount]);
        } else {
            held.push(assetAccount);
        }
    });

    return byNetwork;
};

const selectAssetAccountsByToken = createMemoizedSelector(
    [selectAssetAccounts],
    groupAssetAccountsByToken,
);

// Collections are only ever shown for the wallet on screen, so every NFT selector is device-scoped.
const selectDeviceNftAssetAccountsByToken = createMemoizedSelector(
    [selectDeviceNftAssetAccounts],
    groupAssetAccountsByToken,
);

export type HiddenTokenReason = 'hiddenByUser' | 'unrecognized';

type HiddenTokenReasons = ReadonlyMap<NetworkSymbol, ReadonlyMap<TokenAddress, HiddenTokenReason>>;

type GetHiddenTokenReasonsParams = {
    byNetwork: AssetAccountsByToken;
    tokenDefinitions: TokenDefinitionsState;
    definitionType: DefinitionType;
};

const getHiddenTokenReasons = ({
    byNetwork,
    tokenDefinitions,
    definitionType,
}: GetHiddenTokenReasonsParams): HiddenTokenReasons => {
    const reasons = new Map<NetworkSymbol, Map<TokenAddress, HiddenTokenReason>>();

    // One getTokens call per network rather than per contract: it builds its lookups on every call.
    byNetwork.forEach((byContract, symbol) => {
        const tokens = [...byContract.values()].flatMap(([assetAccount]) =>
            assetAccount?.tokenInfo === undefined ? [] : [assetAccount.tokenInfo],
        );

        const { hiddenWithBalance, hiddenWithoutBalance, unverifiedWithBalance } = getTokens({
            tokens,
            symbol,
            tokenDefinitions: tokenDefinitions?.[symbol]?.[definitionType],
            isNft: definitionType === DefinitionType.NFT,
        });

        const hiddenOnNetwork = new Map<TokenAddress, HiddenTokenReason>();

        unverifiedWithBalance.forEach(token =>
            hiddenOnNetwork.set(token.contract as TokenAddress, 'unrecognized'),
        );
        [...hiddenWithBalance, ...hiddenWithoutBalance].forEach(token =>
            hiddenOnNetwork.set(token.contract as TokenAddress, 'hiddenByUser'),
        );

        if (hiddenOnNetwork.size > 0) {
            reasons.set(symbol, hiddenOnNetwork);
        }
    });

    return reasons;
};

export const selectHiddenTokenReasons = createMemoizedSelector(
    [selectAssetAccountsByToken, selectTokenDefinitions],
    (byNetwork, tokenDefinitions) =>
        getHiddenTokenReasons({
            byNetwork,
            tokenDefinitions,
            definitionType: DefinitionType.COIN,
        }),
);

/** Collections are hidden by the same rule as tokens, against the NFT definitions. */
export const selectDeviceHiddenNftReasons = createMemoizedSelector(
    [selectDeviceNftAssetAccountsByToken, selectTokenDefinitions],
    (byNetwork, tokenDefinitions) =>
        getHiddenTokenReasons({
            byNetwork,
            tokenDefinitions,
            definitionType: DefinitionType.NFT,
        }),
);

const getHiddenAssetAccountKeys = (
    byNetwork: AssetAccountsByToken,
    reasons: HiddenTokenReasons,
): readonly AssetAccountKey[] => {
    const keys: AssetAccountKey[] = [];

    reasons.forEach((hiddenOnNetwork, symbol) => {
        hiddenOnNetwork.forEach((_reason, contractAddress) => {
            byNetwork
                .get(symbol)
                ?.get(contractAddress)
                ?.forEach(assetAccount => keys.push(assetAccount.assetAccountKey));
        });
    });

    return returnStableArrayIfEmpty(keys);
};

export const selectHiddenAssetAccountKeys = createMemoizedSelector(
    [selectAssetAccountsByToken, selectHiddenTokenReasons],
    getHiddenAssetAccountKeys,
);

export const selectDeviceHiddenNftAssetAccountKeys = createMemoizedSelector(
    [selectDeviceNftAssetAccountsByToken, selectDeviceHiddenNftReasons],
    getHiddenAssetAccountKeys,
);

export const selectHiddenAssetAccountKeySet = createMemoizedSelector(
    [selectHiddenAssetAccountKeys],
    (keys): ReadonlySet<AssetAccountKey> => new Set(keys),
);

export const selectDeviceHiddenNftAssetAccountKeySet = createMemoizedSelector(
    [selectDeviceHiddenNftAssetAccountKeys],
    (keys): ReadonlySet<AssetAccountKey> => new Set(keys),
);
