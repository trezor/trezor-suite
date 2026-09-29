import {
    type NetworkSymbol,
    getNetworkDisplaySymbol,
    getNetworkDisplaySymbolName,
    getNetworkOptional,
} from '@suite-common/wallet-config';
import { type AssetAccount } from '@suite-common/wallet-core';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { type Padding } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

export type HomeAssetGrouping = 'default' | 'networks';

export const HOME_ASSET_CELL_PADDING = {
    first: { vertical: 12, left: 20, right: 20 },
    last: { vertical: 12, left: 20, right: 20 },
} satisfies Record<string, Padding>;

export const sumAssetAccounts = (assetAccounts: readonly AssetAccount[]) => ({
    cryptoBalance: assetAccounts.reduce(
        (total, assetAccount) => total.plus(assetAccount.cryptoBalance),
        new BigNumber(0),
    ),
    tokenInfo: assetAccounts.find(assetAccount => assetAccount.tokenInfo !== undefined)?.tokenInfo,
});

export const getAssetDisplaySymbol = ({
    symbol,
    tokenInfo,
}: {
    symbol: NetworkSymbol;
    tokenInfo: TokenInfo | undefined;
}) => tokenInfo?.symbol?.toUpperCase() ?? getNetworkDisplaySymbol(symbol);

export const getAssetName = ({
    symbol,
    tokenInfo,
}: {
    symbol: NetworkSymbol;
    tokenInfo: TokenInfo | undefined;
}) => {
    if (tokenInfo) {
        return tokenInfo.name ?? tokenInfo.symbol ?? '';
    }

    const issuingNetwork = getNetworkOptional(getNetworkDisplaySymbol(symbol).toLowerCase());

    return issuingNetwork?.name ?? getNetworkDisplaySymbolName(symbol);
};
