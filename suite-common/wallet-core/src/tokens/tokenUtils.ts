import { type TokenDefinition, isTokenDefinitionKnown } from '@suite-common/token-definitions';
import {
    type NetworkSymbol,
    getNetworkDisplaySymbol,
    getNetworkFeatures,
} from '@suite-common/wallet-config';
import { type Account, type TokenSymbol } from '@suite-common/wallet-types';
import { isNftMatchesSearch, isNftToken, isTokenMatchesSearch } from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

type GetTokensInput<T extends TokenInfo> = {
    tokens?: T[];
    symbol: NetworkSymbol;
    tokenDefinitions?: TokenDefinition;
    searchQuery?: string;
    isNft?: boolean;
};

export type GetTokensOutputType<T extends TokenInfo = TokenInfo> = {
    shownWithBalance: T[];
    shownWithoutBalance: T[];
    hiddenWithBalance: T[];
    hiddenWithoutBalance: T[];
    unverifiedWithBalance: T[];
    unverifiedWithoutBalance: T[];
};

export const getTokens = <T extends TokenInfo = TokenInfo>({
    tokens = [],
    symbol,
    tokenDefinitions,
    searchQuery,
    isNft = false,
}: GetTokensInput<T>): GetTokensOutputType<T> => {
    const filteredTokens = isNft
        ? tokens.filter(token => isNftToken(token))
        : tokens.filter(token => !isNftToken(token));

    const hasDefinitions = getNetworkFeatures(symbol).includes(
        isNft ? 'nft-definitions' : 'coin-definitions',
    );

    const shownWithBalance: T[] = [];
    const shownWithoutBalance: T[] = [];
    const hiddenWithBalance: T[] = [];
    const hiddenWithoutBalance: T[] = [];
    const unverifiedWithBalance: T[] = [];
    const unverifiedWithoutBalance: T[] = [];

    const hiddenTokens = new Set(tokenDefinitions?.hide);
    const shownTokens = new Set(tokenDefinitions?.show);

    filteredTokens.forEach(token => {
        const isKnown = isTokenDefinitionKnown(tokenDefinitions?.data, symbol, token.contract);
        const isHidden = hiddenTokens.has(token.contract);
        const isShown = shownTokens.has(token.contract);

        const query = searchQuery ? searchQuery.trim().toLowerCase() : '';

        if (
            searchQuery &&
            !(isNft ? isNftMatchesSearch(token, query) : isTokenMatchesSearch(token, query))
        )
            return;

        const hasBalance =
            new BigNumber(token?.balance || '0').gt(0) ||
            (isNft && (token?.multiTokenValues?.length || token?.ids?.length || 0) > 0);

        const pushToArray = (arrayWithBalance: T[], arrayWithoutBalance: T[]) => {
            if (hasBalance) {
                arrayWithBalance.push(token);
            } else {
                arrayWithoutBalance.push(token);
            }
        };

        if (isShown) {
            pushToArray(shownWithBalance, shownWithoutBalance);
        } else if (hasDefinitions && !isKnown) {
            pushToArray(unverifiedWithBalance, unverifiedWithoutBalance);
        } else if (isHidden) {
            pushToArray(hiddenWithBalance, hiddenWithoutBalance);
        } else {
            pushToArray(shownWithBalance, shownWithoutBalance);
        }
    });

    return {
        shownWithBalance,
        shownWithoutBalance,
        hiddenWithBalance,
        hiddenWithoutBalance,
        unverifiedWithBalance,
        unverifiedWithoutBalance,
    };
};

export const getAccountAnalyticsTokenSymbols = (
    account: Account,
    tokenDefinitions: TokenDefinition | undefined,
): TokenSymbol[] => {
    const { symbol } = account;

    const nativeTokenSymbol = new BigNumber(account.balance).gt(0)
        ? (getNetworkDisplaySymbol(symbol) as TokenSymbol)
        : undefined;

    const tokenSymbols = getTokens({ tokens: account.tokens ?? [], symbol, tokenDefinitions })
        .shownWithBalance.map(token => token.symbol)
        .filter((tokenSymbol): tokenSymbol is TokenSymbol => !!tokenSymbol);

    return [...new Set(nativeTokenSymbol ? [nativeTokenSymbol, ...tokenSymbols] : tokenSymbols)];
};
