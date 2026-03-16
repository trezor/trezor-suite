import { type AccountWithSuiteSyncLabel } from '@suite-common/suite-sync';
import { type AccountKey } from '@suite-common/wallet-types';

import { type TokensWithRates } from 'src/utils/wallet/tokenUtils';

import { ASSET_ROW_HEIGHT, EXPANDABLE_ASSET_ROW_TOKENS_HEADER_HEIGHT } from '../constants';
import { type AccountWithTokensOption } from '../types';

export function calculateExpandableTokensHeight(expanded: boolean, hiddenTokensLength: number) {
    const tokensHeight = expanded ? hiddenTokensLength * (ASSET_ROW_HEIGHT - 8) : 0;

    return EXPANDABLE_ASSET_ROW_TOKENS_HEADER_HEIGHT + tokensHeight;
}

interface CreateHiddenTokensOptionProps {
    account: AccountWithSuiteSyncLabel;
    hiddenTokens: TokensWithRates[];
    expandedHiddenTokensGroups: AccountKey[];
}

export function createHiddenTokensOption({
    account,
    hiddenTokens,
    expandedHiddenTokensGroups,
}: CreateHiddenTokensOptionProps) {
    const expanded = expandedHiddenTokensGroups.includes(account.key);

    return {
        type: 'hidden-tokens',
        account,
        tokens: hiddenTokens,
        height: calculateExpandableTokensHeight(expanded, hiddenTokens.length),
        expanded,
    } satisfies Extract<AccountWithTokensOption, { type: 'hidden-tokens' }>;
}

interface CreateNonradableTokensOptionProps {
    account: AccountWithSuiteSyncLabel;
    nonTradableTokens: TokensWithRates[];
    expandedNonTradableTokensGroups: AccountKey[];
}

export function createNonTradableTokensOption({
    account,
    nonTradableTokens,
    expandedNonTradableTokensGroups,
}: CreateNonradableTokensOptionProps) {
    const expanded = expandedNonTradableTokensGroups.includes(account.key);

    return {
        type: 'non-tradable-tokens',
        account,
        tokens: nonTradableTokens,
        height: calculateExpandableTokensHeight(expanded, nonTradableTokens.length),
        expanded,
    } satisfies Extract<AccountWithTokensOption, { type: 'non-tradable-tokens' }>;
}

export const createAccountOption = (account: AccountWithSuiteSyncLabel) =>
    ({
        type: 'account',
        account,
        height: ASSET_ROW_HEIGHT,
    }) satisfies Extract<AccountWithTokensOption, { type: 'account' }>;

export const createTokenOption = (account: AccountWithSuiteSyncLabel, token: TokensWithRates) =>
    ({
        type: 'token',
        account,
        token,
        height: ASSET_ROW_HEIGHT,
    }) satisfies Extract<AccountWithTokensOption, { type: 'token' }>;
