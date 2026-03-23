import { type TranslationId } from '@suite/intl';
import {
    type EnhancedTokenInfo,
    type TokenDefinition,
    type TokenDefinitionsState,
    isTokenDefinitionKnown,
} from '@suite-common/token-definitions';
import {
    type NetworkSymbol,
    type NetworkType,
    getNetworkFeatures,
} from '@suite-common/wallet-config';
import {
    type Account,
    type Rate,
    type RatesByKey,
    type TokenAddress,
} from '@suite-common/wallet-types';
import {
    getFiatRateKey,
    isNftMatchesSearch,
    isNftToken,
    isTokenMatchesSearch,
} from '@suite-common/wallet-utils';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { type TokenInfo } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

export interface TokensWithRates extends TokenInfo {
    fiatValue: BigNumber;
    fiatRate?: Rate;
}

// sort by 1. total fiat, 2. token price, 3. symbol length, 4. alphabetically
export const sortTokensWithRates = (a: TokensWithRates, b: TokensWithRates) => {
    const balanceSort =
        // Sort by balance multiplied by USD rate
        b.fiatValue.minus(a.fiatValue).toNumber() ||
        // If balance is equal, sort by USD rate
        (b.fiatRate?.rate || -1) - (a.fiatRate?.rate || -1) ||
        // If USD rate is equal or missing, sort by symbol length
        (a.symbol || '').length - (b.symbol || '').length ||
        // If symbol length is equal, sort by symbol name alphabetically
        (a.symbol || '').localeCompare(b.symbol || '', undefined, { sensitivity: 'base' });

    return balanceSort;
};

export const enhanceTokensWithRates = (
    tokens: Account['tokens'],
    baseCurrencyCode: BaseCurrencyCode,
    symbol: NetworkSymbol,
    rates?: RatesByKey,
) => {
    if (!tokens?.length) return [];

    const tokensWithRates = tokens.map(token => {
        const tokenFiatRateKey = getFiatRateKey(
            symbol,
            baseCurrencyCode,
            token.contract as TokenAddress,
        );
        const fiatRate = rates?.[tokenFiatRateKey];

        const fiatValue = new BigNumber(token.balance || 0).multipliedBy(fiatRate?.rate || 0);

        return {
            ...token,
            fiatRate,
            fiatValue,
        };
    });

    return tokensWithRates;
};

export type EnahncedTokenInfoWithFiat = ReturnType<typeof enhanceTokensWithRates>[number];

type GetTokens<T extends EnhancedTokenInfo | TokenInfo | EnahncedTokenInfoWithFiat> = {
    tokens: T[];
    symbol: NetworkSymbol;
    tokenDefinitions?: TokenDefinition;
    searchQuery?: string;
    isNft?: boolean;
};

export type GetTokensOutputType<
    T extends EnhancedTokenInfo | TokenInfo | EnahncedTokenInfoWithFiat = EnhancedTokenInfo,
> = {
    shownWithBalance: T[];
    shownWithoutBalance: T[];
    hiddenWithBalance: T[];
    hiddenWithoutBalance: T[];
    unverifiedWithBalance: T[];
    unverifiedWithoutBalance: T[];
};

export const getTokens = <
    T extends EnhancedTokenInfo | TokenInfo | EnahncedTokenInfoWithFiat = EnhancedTokenInfo,
>({
    tokens = [],
    symbol,
    tokenDefinitions,
    searchQuery,
    isNft = false,
}: GetTokens<T>): GetTokensOutputType<T> => {
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

export const hasVisibleTokens = (
    symbol: NetworkSymbol,
    tokens: TokenInfo[] | undefined,
    tokenDefinitions: Partial<TokenDefinitionsState>,
    isNft: boolean = false,
): boolean => {
    if (!tokens || tokens.length === 0) return false;

    const coinDefinitions = tokenDefinitions?.[symbol]?.coin;
    if (!coinDefinitions) return false;

    const currentTokens = getTokens({
        tokens,
        symbol,
        tokenDefinitions: coinDefinitions,
        isNft,
    });

    const visibleTokenCount =
        currentTokens.shownWithBalance.length + currentTokens.shownWithoutBalance.length;

    return visibleTokenCount > 0;
};

export const getTokenAddressTranslationId = (networkType: NetworkType): TranslationId => {
    switch (networkType) {
        case 'solana':
            return 'TR_TOKEN_ADDRESS';
        case 'cardano':
            return 'TR_POLICY_ID_ADDRESS';
        default:
            return 'TR_CONTRACT_ADDRESS';
    }
};

export function getAccountsWithPositiveBalanceOrVisibleTokens(
    accounts: Account[],
    tokenDefinitions: TokenDefinitionsState,
): Account[] {
    return accounts.filter(account =>
        hasVisibleTokens(account.symbol, account.tokens, tokenDefinitions),
    );
}
