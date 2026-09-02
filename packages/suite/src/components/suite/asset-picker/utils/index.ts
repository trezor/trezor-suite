import { type AccountKey } from '@suite-common/wallet-types';

import { type TokensWithRates } from 'src/utils/wallet/tokenUtils';

import { type AccountWithOptionalLabel, type AccountWithTokensOption } from '../types';

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
    return {
        type: 'hidden-tokens',
        account,
        tokens: hiddenTokens,
        expanded: expandedHiddenTokensGroups.includes(account.key),
    } satisfies Extract<AccountWithTokensOption, { type: 'hidden-tokens' }>;
}

export const createAccountOption = (account: AccountWithOptionalLabel) =>
    ({
        type: 'account',
        account,
    }) satisfies Extract<AccountWithTokensOption, { type: 'account' }>;

export const createTokenOption = (account: AccountWithOptionalLabel, token: TokensWithRates) =>
    ({
        type: 'token',
        account,
        token,
    }) satisfies Extract<AccountWithTokensOption, { type: 'token' }>;
