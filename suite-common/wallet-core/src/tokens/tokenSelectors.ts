import { createWeakMapSelector } from '@suite-common/redux-utils';
import {
    type TokenDefinitionsRootState,
    selectTokenDefinitions,
} from '@suite-common/token-definitions';
import { type TokenInfoBranded } from '@suite-common/wallet-types';
import { isErc4626 } from '@suite-common/wallet-utils';

import { type GetTokensOutputType, getTokens } from './tokenUtils';
import { type AccountsRootState } from '../accounts/accountsReducer';
import { selectAccountByKey } from '../accounts/accountsSelectors';

export type TokensRootState = AccountsRootState & TokenDefinitionsRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<TokensRootState>();

export const selectAccountTokens = createMemoizedSelector(
    [selectAccountByKey, selectTokenDefinitions],
    (account, tokenDefinitions): GetTokensOutputType | null => {
        if (!account) return null;

        return getTokens({
            tokens: account.tokens ?? [],
            symbol: account.symbol,
            tokenDefinitions: tokenDefinitions[account.symbol]?.coin,
        });
    },
);

export const selectAccountHiddenTokens = createMemoizedSelector(
    [selectAccountTokens],
    (tokenCategories): TokenInfoBranded[] => {
        if (!tokenCategories) return [];

        const {
            hiddenWithBalance,
            hiddenWithoutBalance,
            unverifiedWithBalance,
            unverifiedWithoutBalance,
        } = tokenCategories;

        return [
            ...hiddenWithBalance,
            ...hiddenWithoutBalance,
            ...unverifiedWithBalance,
            ...unverifiedWithoutBalance,
        ] as TokenInfoBranded[];
    },
);

export const selectAccountDefiTokens = createMemoizedSelector(
    [selectAccountTokens],
    (tokenCategories): TokenInfoBranded[] => {
        if (!tokenCategories) return [];

        return tokenCategories.shownWithBalance.filter(isErc4626) as TokenInfoBranded[];
    },
);

export const selectAccountDefiTokensCount = createMemoizedSelector(
    [selectAccountDefiTokens],
    (defiTokens): number => defiTokens.length,
);
