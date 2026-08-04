import { type CryptoId } from 'invity-api';

import { type TradingAssetOption, getCryptoId } from '@suite-common/trading';
import { type NetworkConfigDeps, type NetworkSymbol } from '@suite-common/wallet-config';
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

type GetTokensDisplaySymbolNamesProps = NetworkConfigDeps & {
    assets: TradingAssetOption[];
    tokens: TokenDisplayNameSource[];
};

type GetTokenDisplaySymbolNameProps = NetworkConfigDeps & {
    tokenDisplaySymbolNames: Map<CryptoId, string>;
    account: TokenDisplayNameSource['account'];
    token: TokenDisplayNameSource['token'];
};

export const getTokenCryptoIds = (deps: NetworkConfigDeps, tokens: TokenDisplayNameSource[]) => {
    const tokenCryptoIds = new Set<CryptoId>();

    for (const { account, token } of tokens) {
        tokenCryptoIds.add(getCryptoId(deps, account.symbol, token.contract));
    }

    return tokenCryptoIds;
};

export const getTokensDisplaySymbolNames = ({
    getNetworkConfig,
    networkModuleRepository,
    assets,
    tokens,
}: GetTokensDisplaySymbolNamesProps) => {
    const tokenCryptoIds = getTokenCryptoIds({ getNetworkConfig, networkModuleRepository }, tokens);
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

export const getTokenDisplaySymbolName = ({
    getNetworkConfig,
    networkModuleRepository,
    tokenDisplaySymbolNames,
    account,
    token,
}: GetTokenDisplaySymbolNameProps) =>
    tokenDisplaySymbolNames.get(
        getCryptoId({ getNetworkConfig, networkModuleRepository }, account.symbol, token.contract),
    ) ?? token.name;
