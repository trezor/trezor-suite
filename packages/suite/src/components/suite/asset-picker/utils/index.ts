import { type AccountKey } from '@suite-common/wallet-types';

import { type TokensWithRates } from 'src/utils/wallet/tokenUtils';

import { ASSET_ROW_HEIGHT, EXPANDABLE_ASSET_ROW_TOKENS_HEADER_HEIGHT } from '../constants';
import { type AccountWithOptionalLabel, type AccountWithTokensOption } from '../types';

export function getExpandableTokensContentHeight(tokenCount: number) {
    return tokenCount * (ASSET_ROW_HEIGHT - 8);
}

export function calculateExpandableTokensHeight(expanded: boolean, tokenCount: number) {
    const tokensHeight = expanded ? getExpandableTokensContentHeight(tokenCount) : 0;

    return EXPANDABLE_ASSET_ROW_TOKENS_HEADER_HEIGHT + tokensHeight;
}

interface CreateHiddenTokensOptionProps {
    account: AccountWithOptionalLabel;
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

export const createAccountOption = (account: AccountWithOptionalLabel) =>
    ({
        type: 'account',
        account,
        height: ASSET_ROW_HEIGHT,
    }) satisfies Extract<AccountWithTokensOption, { type: 'account' }>;

export const createTokenOption = (account: AccountWithOptionalLabel, token: TokensWithRates) =>
    ({
        type: 'token',
        account,
        token,
        height: ASSET_ROW_HEIGHT,
    }) satisfies Extract<AccountWithTokensOption, { type: 'token' }>;
