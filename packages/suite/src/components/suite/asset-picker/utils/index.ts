import { Account, AccountKey } from '@suite-common/wallet-types';

import { TokensWithRates } from 'src/utils/wallet/tokenUtils';

import { ASSET_ROW_HEIGHT, EXPANDABLE_ASSET_ROW_TOKENS_HEADER_HEIGHT } from '../constants';
import { AccountWithTokensOption } from '../types';

export function calculateHiddenTokensHeight(expanded: boolean, hiddenTokensLength: number) {
    const tokensHeight = expanded ? hiddenTokensLength * (ASSET_ROW_HEIGHT - 8) : 0;

    return EXPANDABLE_ASSET_ROW_TOKENS_HEADER_HEIGHT + tokensHeight;
}

interface CreateHiddenTokensOptionProps {
    account: Account;
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
        height: calculateHiddenTokensHeight(expanded, hiddenTokens.length),
        expanded,
    } satisfies Extract<AccountWithTokensOption, { type: 'hidden-tokens' }>;
}

export const createAccountOption = (account: Account) =>
    ({
        type: 'account',
        account,
        height: ASSET_ROW_HEIGHT,
    }) satisfies Extract<AccountWithTokensOption, { type: 'account' }>;

export const createTokenOption = (account: Account, token: TokensWithRates) =>
    ({
        type: 'token',
        account,
        token,
        height: ASSET_ROW_HEIGHT,
    }) satisfies Extract<AccountWithTokensOption, { type: 'token' }>;
