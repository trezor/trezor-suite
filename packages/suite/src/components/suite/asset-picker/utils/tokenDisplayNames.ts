import { type CryptoId } from 'invity-api';

import { type NetworkConfigDeps } from '@suite-common/networks';
import { type TradingAssetOption, getCryptoId } from '@suite-common/trading';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenInfo } from '@trezor/connect';

export type TokenDisplayNameSource = {
    account: {
        symbol: NetworkSymbol;
    };
    token: {
        contract: TokenInfo['contract'];
        name?: string;
    };
};

type GetTokensDisplaySymbolNamesProps = {
    assets: TradingAssetOption[];
    tokens: TokenDisplayNameSource[];
};

type GetTokenDisplaySymbolNameProps = {
    tokenDisplaySymbolNames: Map<CryptoId, string>;
    account: TokenDisplayNameSource['account'];
    token: TokenDisplayNameSource['token'];
};

export const getTokenCryptoIds = (
    networkConfigDeps: NetworkConfigDeps,
    tokens: TokenDisplayNameSource[],
) => {
    const tokenCryptoIds = new Set<CryptoId>();

    for (const { account, token } of tokens) {
        tokenCryptoIds.add(getCryptoId(networkConfigDeps, account.symbol, token.contract));
    }

    return tokenCryptoIds;
};

export const getTokensDisplaySymbolNames = (
    networkConfigDeps: NetworkConfigDeps,
    { assets, tokens }: GetTokensDisplaySymbolNamesProps,
) => {
    const tokenCryptoIds = getTokenCryptoIds(networkConfigDeps, tokens);
    const displaySymbolNames = new Map<CryptoId, string>();

    if (tokenCryptoIds.size === 0) {
        return displaySymbolNames;
    }

    for (const asset of assets) {
        if (!tokenCryptoIds.has(asset.id)) {
            continue;
        }

        displaySymbolNames.set(asset.id, asset.displaySymbolName ?? asset.name);

        if (displaySymbolNames.size === tokenCryptoIds.size) {
            break;
        }
    }

    return displaySymbolNames;
};

export const getTokenDisplaySymbolName = (
    networkConfigDeps: NetworkConfigDeps,
    { tokenDisplaySymbolNames, account, token }: GetTokenDisplaySymbolNameProps,
) =>
    tokenDisplaySymbolNames.get(getCryptoId(networkConfigDeps, account.symbol, token.contract)) ??
    token.name;
