import { type ChainAsset } from '@suite-common/chain-data';
import { type TokenDefinition } from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { getTokens } from '@suite-common/wallet-core';
import { type TokenInfo } from '@trezor/blockchain-link-types';

type ChainTokenInfo = TokenInfo & { chainAsset: ChainAsset };

// `getTokens` only compares the balance with zero, so whole units serve as well as subunits.
const toTokenInfo = (asset: ChainAsset): ChainTokenInfo => ({
    standard: asset.standard ?? 'ERC20',
    contract: asset.contract ?? '',
    symbol: asset.symbol,
    name: asset.name,
    decimals: asset.decimals ?? 0,
    balance: asset.amount,
    chainAsset: asset,
});

/**
 * Keeps the tokens the dashboard shows today, by the same rule (known or unhidden, with balance),
 * and every native asset. Which tokens to show is the app's decision; networks report them all.
 */
export const filterShownChainTokens = (
    assets: readonly ChainAsset[],
    getCoinDefinitions: (symbol: NetworkSymbol) => TokenDefinition | undefined,
): ChainAsset[] => {
    const tokensBySymbol = new Map<NetworkSymbol, ChainAsset[]>();
    assets
        .filter(asset => asset.kind === 'token')
        .forEach(asset => {
            const tokens = tokensBySymbol.get(asset.ref.symbol) ?? [];
            tokens.push(asset);
            tokensBySymbol.set(asset.ref.symbol, tokens);
        });

    const shownTokens = new Set(
        [...tokensBySymbol].flatMap(([symbol, tokens]) =>
            getTokens({
                tokens: tokens.map(toTokenInfo),
                symbol,
                tokenDefinitions: getCoinDefinitions(symbol),
            }).shownWithBalance.map(token => token.chainAsset),
        ),
    );

    return assets.filter(asset => asset.kind === 'native' || shownTokens.has(asset));
};
