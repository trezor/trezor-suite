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

/**
 * The outer cells carry the page's own horizontal padding, because the table is wider than the
 * content around it: the lines between assets run to the edge of the page while the text under
 * "Asset" stays aligned with the balance above it.
 */
export const ASSET_FIRST_CELL_PADDING = {
    first: { vertical: 12, left: 16, right: 20 },
    last: { vertical: 12, left: 20, right: 16 },
} satisfies Record<string, Padding>;

/**
 * What a wallet holds of one asset on one network, added up over its accounts there.
 *
 * A wallet can have several accounts on a network — and several of them can hold the same token —
 * but the table shows one line per asset and network, so their holdings are one number.
 */
export const sumAssetHoldings = (holdings: readonly AssetHolding[]) => ({
    cryptoBalance: holdings.reduce(
        (total, holding) => total.plus(holding.cryptoBalance),
        new BigNumber(0),
    ),
    tokenInfo: holdings.find(holding => holding.tokenInfo !== undefined)?.tokenInfo,
});

/**
 * What the asset is, across the networks it lives on: ETH held on Arbitrum is the same asset as ETH
 * held on Ethereum, and a table that puts them next to each other needs to say so.
 */
export const getAssetDisplaySymbol = ({
    symbol,
    tokenInfo,
}: {
    symbol: NetworkSymbol;
    tokenInfo: TokenInfo | undefined;
}) => tokenInfo?.symbol?.toUpperCase() ?? getNetworkDisplaySymbol(symbol);

/**
 * The asset's name, not the name of the network it is held on.
 *
 * For a coin that is the network which issues it — `arb`'s coin is Ethereum's ETH, so the row says
 * Ethereum, with Arbitrum One as the network beside it.
 */
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

export const getNetworkName = (symbol: NetworkSymbol) => getNetwork(symbol).name;
