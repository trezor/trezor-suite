import {
    type NetworkSymbol,
    getNetwork,
    getNetworkDisplaySymbol,
    getNetworkDisplaySymbolName,
    getNetworkOptional,
} from '@suite-common/wallet-config';
import { type AssetHolding } from '@suite-common/wallet-core';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { type Padding } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

export type AssetFirstGrouping = 'default' | 'networks';

export const ASSET_FIRST_CELL_PADDING = {
    first: { vertical: 12, left: 20, right: 20 },
    last: { vertical: 12, left: 20, right: 20 },
} satisfies Record<string, Padding>;

export const sumAssetHoldings = (holdings: readonly AssetHolding[]) => ({
    cryptoBalance: holdings.reduce(
        (total, holding) => total.plus(holding.cryptoBalance),
        new BigNumber(0),
    ),
    tokenInfo: holdings.find(holding => holding.tokenInfo !== undefined)?.tokenInfo,
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

    // `arb`'s coin is Ethereum's ETH, so the row is named after the issuing network.
    const issuingNetwork = getNetworkOptional(getNetworkDisplaySymbol(symbol).toLowerCase());

    return issuingNetwork?.name ?? getNetworkDisplaySymbolName(symbol);
};

export const getNetworkName = (symbol: NetworkSymbol) => getNetwork(symbol).name;
