import { type DeviceRootState } from '@suite-common/device';
import { type TokenDefinitionsRootState } from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { type StaticSessionId } from '@trezor/device-utils';
import { type Branded } from '@trezor/type-utils';

import { type AccountsRootState } from './accountsReducer';

/** One asset of one wallet: a coin or a token, over every account of the wallet that holds it. */
export type WalletAssetKey = string & Branded<'WalletAssetKey'>;

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

export type AssetAccountsRootState = AccountsRootState &
    DeviceRootState &
    TokenDefinitionsRootState;
