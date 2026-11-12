import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { type StaticSessionId } from '@trezor/device-utils';
import { type Branded } from '@trezor/type-utils';

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

export const getAssetAccountKey = ({
    accountKey,
    contractAddress,
}: AssetAccountKeyParams): AssetAccountKey =>
    [accountKey, contractAddress ?? NATIVE_COIN_CONTRACT].join(
        ASSET_KEY_SEPARATOR,
    ) as AssetAccountKey;
