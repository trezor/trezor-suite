import {
    type StakingRootState,
    formatStakingAmount,
    isStakeInsideAccountBalance,
    selectIsStakingAccountActive,
    selectStakingAccountAmount,
} from '@suite-common/earn-staking';
import { type NetworksRootState, selectNativeTokenName } from '@suite-common/networks';
import {
    type TokenDefinition,
    type TokenDefinitionsRootState,
    selectTokenDefinitions,
} from '@suite-common/token-definitions';
import { type TokenAddress, type TokenInfoBranded } from '@suite-common/tokens';
import { getNetworkDisplaySymbol, isNetworkWithTokens } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type FiatRatesRootState,
    type WalletSettingsRootState,
    getTokens,
    selectAccountByKey,
    selectBaseCurrency,
    selectCurrentFiatRates,
} from '@suite-common/wallet-core';
import { type Account, type AccountKey, type RatesByKey } from '@suite-common/wallet-types';
import {
    getFiatRateKey,
    isErc4626,
    isPositiveBalance,
    isTokenMatchesSearch,
    sortTokensByName,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { createWeakMapSelector } from '@trezor/redux-utils';

export type AccountListSectionsRootState = AccountsRootState &
    FiatRatesRootState &
    WalletSettingsRootState &
    TokenDefinitionsRootState &
    StakingRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<AccountListSectionsRootState>();

export type AccountListSection =
    | {
          type: 'account';
          account: Account;
          hasAnyKnownTokens: boolean;
      }
    | {
          type: 'staking';
          account: Account;
          stakingCryptoBalance: string;
      }
    | {
          type: 'token';
          account: Account;
          token: TokenInfoBranded;
      }
    | {
          type: 'zeroBalance';
          account: Account;
          tokens: TokenInfoBranded[];
      };

/** What tells a section of an account's list from the others: its coin, its stake, or a token. */
export const getAccountListSectionKey = (section: AccountListSection) => {
    switch (section.type) {
        case 'account':
            return 'coin';
        case 'token':
            return section.token.contract;
        default:
            return section.type;
    }
};

export type AccountListSectionAmount = {
    amount: string;
    /** Left out for the account's coin and its stake. */
    tokenAddress: TokenAddress | undefined;
};

/**
 * What the section's row shows the account holding. None for the zero-balance group, and none for
 * a stake inside the balance (Cardano), which the coin already holds.
 */
export const getAccountListSectionAmount = (
    section: AccountListSection,
): AccountListSectionAmount | undefined => {
    switch (section.type) {
        case 'account':
            return { amount: section.account.formattedBalance, tokenAddress: undefined };
        case 'staking':
            return isStakeInsideAccountBalance(section.account.symbol)
                ? undefined
                : { amount: section.stakingCryptoBalance, tokenAddress: undefined };
        case 'token':
            return { amount: section.token.balance ?? '0', tokenAddress: section.token.contract };
        case 'zeroBalance':
            return undefined;
    }
};

export type GetAccountListSectionsParams = {
    account: Account;
    tokenDefinitions: TokenDefinition | undefined;
    isStakingActive: boolean;
    stakingCryptoBalance: string;
    groupZeroBalance?: boolean;
    /** Vault tokens (ERC-4626) among the tokens; mobile lists them in its DeFi tab instead. */
    areVaultTokensListed?: boolean;
    fiatRates?: RatesByKey;
    localCurrency?: ReturnType<typeof selectBaseCurrency>;
};

export const getAccountListSections = ({
    account,
    tokenDefinitions,
    isStakingActive,
    stakingCryptoBalance,
    groupZeroBalance = false,
    areVaultTokensListed = false,
    fiatRates,
    localCurrency,
}: GetAccountListSectionsParams) => {
    const sections: AccountListSection[] = [];
    const isListed = (token: TokenInfo) => areVaultTokensListed || !isErc4626(token);
    const isNetworkSupportingTokens = isNetworkWithTokens(account.symbol);

    const { shownWithBalance: tokensWithBalance, shownWithoutBalance } = getTokens({
        tokens: account.tokens,
        symbol: account.symbol,
        tokenDefinitions,
    });

    const zeroBalanceTokens: TokenInfoBranded[] = groupZeroBalance
        ? (shownWithoutBalance.filter(isListed) as TokenInfoBranded[])
        : [];

    const hasAnyKnownTokens =
        isNetworkSupportingTokens && !!(tokensWithBalance.length + zeroBalanceTokens.length);

    sections.push({
        type: 'account',
        account,
        hasAnyKnownTokens,
    });

    if (isStakingActive) {
        sections.push({
            type: 'staking',
            account,
            stakingCryptoBalance,
        });
    }

    if (hasAnyKnownTokens) {
        const getTokenFiatValue = (token: { contract: string; balance?: string }): number => {
            if (!fiatRates || !localCurrency) return 0;
            const fiatRateKey = getFiatRateKey(
                account.symbol,
                localCurrency,
                token.contract as TokenAddress,
            );
            const rate = fiatRates[fiatRateKey]?.rate;
            if (!rate || !token.balance) return 0;

            return toFiatCurrency({ amount: token.balance, rate })?.toNumber() ?? 0;
        };

        const tokensToShow = tokensWithBalance
            .filter(isListed)
            .sort((a, b) => getTokenFiatValue(b) - getTokenFiatValue(a));
        tokensToShow.forEach(token => {
            sections.push({
                type: 'token',
                account,
                token: token as TokenInfoBranded,
            });
        });

        if (zeroBalanceTokens.length > 0) {
            sections.push({
                type: 'zeroBalance',
                account,
                tokens: [...zeroBalanceTokens].sort(sortTokensByName),
            });
        }
    }

    return sections;
};

const EMPTY_ARRAY: AccountListSection[] = [];

const createAccountListSectionsSelector = (areVaultTokensListed: boolean) =>
    createMemoizedSelector(
        [
            selectAccountByKey,
            selectTokenDefinitions,
            selectCurrentFiatRates,
            selectBaseCurrency,
            selectIsStakingAccountActive,
            selectStakingAccountAmount,
        ],
        (account, tokenDefinitions, fiatRates, localCurrency, isStakingActive, stakingAmount) => {
            if (!account) return EMPTY_ARRAY;

            return getAccountListSections({
                account,
                tokenDefinitions: tokenDefinitions[account.symbol]?.coin,
                isStakingActive,
                stakingCryptoBalance: formatStakingAmount({
                    amount: stakingAmount,
                    networkSymbol: account.symbol,
                }),
                groupZeroBalance: true,
                areVaultTokensListed,
                fiatRates,
                localCurrency,
            });
        },
    );

export const selectAccountListSectionsWithZeroBalanceGroup =
    createAccountListSectionsSelector(false);

/** The same sections with the vault tokens among the tokens, as the desktop account overview lists them. */
export const selectAccountListSectionsWithVaultTokens = createAccountListSectionsSelector(true);

export type AccountAssetOverview = {
    /** The coin, the stake and the tokens the account holds something of, in the list's order. */
    heldSections: readonly AccountListSection[];
    /** The known tokens it holds none of, each as a token section. */
    zeroBalanceSections: readonly AccountListSection[];
    /** The coin once, whether it is held, staked or both, and each token held. */
    assetCount: number;
};

// A stake counts as held whether or not its row shows an amount: a Cardano delegation still gets a row.
const isCoinSectionHeld = (section: AccountListSection) =>
    (section.type === 'account' && isPositiveBalance(section.account.formattedBalance)) ||
    (section.type === 'staking' && isPositiveBalance(section.stakingCryptoBalance));

/**
 * What the desktop account overview shows of the list: one place that says what counts as held,
 * so the table, the balance card and the count cannot disagree.
 */
export const selectAccountAssetOverview = createMemoizedSelector(
    [selectAccountListSectionsWithVaultTokens],
    (sections): AccountAssetOverview => {
        const heldSections = sections.filter(
            section => isCoinSectionHeld(section) || section.type === 'token',
        );

        return {
            heldSections,
            zeroBalanceSections: sections.flatMap((section): AccountListSection[] =>
                section.type === 'zeroBalance'
                    ? section.tokens.map(token => ({
                          type: 'token',
                          account: section.account,
                          token,
                      }))
                    : [],
            ),
            assetCount:
                heldSections.filter(section => section.type === 'token').length +
                (heldSections.some(isCoinSectionHeld) ? 1 : 0),
        };
    },
);

const createSearchSelector = createWeakMapSelector.withTypes<
    AccountListSectionsRootState & NetworksRootState
>();

const selectAccountNativeTokenName = (
    state: AccountListSectionsRootState & NetworksRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);

    return account === null ? undefined : selectNativeTokenName(state, account.symbol);
};

/**
 * The sections whose name, symbol or contract contains the query, in the list's order. The tokens
 * held at zero are searched too and come as token sections, so a match needs no group opened.
 */
export const selectAccountListSectionsMatchingSearch = createSearchSelector(
    [
        (state: AccountListSectionsRootState, accountKey: AccountKey) =>
            selectAccountListSectionsWithVaultTokens(state, accountKey),
        selectAccountNativeTokenName,
        (_state: AccountListSectionsRootState, _accountKey: AccountKey, searchQuery: string) =>
            searchQuery.trim().toLowerCase(),
    ],
    (sections, nativeTokenName, query): AccountListSection[] =>
        sections.flatMap((section): AccountListSection[] => {
            switch (section.type) {
                case 'account':
                case 'staking':
                    return [getNetworkDisplaySymbol(section.account.symbol), nativeTokenName].some(
                        label => label?.toLowerCase().includes(query),
                    )
                        ? [section]
                        : [];
                case 'token':
                    return isTokenMatchesSearch(section.token, query) ? [section] : [];
                case 'zeroBalance':
                    return section.tokens
                        .filter(token => isTokenMatchesSearch(token, query))
                        .map(token => ({ type: 'token', account: section.account, token }));
                default:
                    return [];
            }
        }),
);
