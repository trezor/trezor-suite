import {
    getSimpleCoinDefinitionsByNetwork,
    selectTokenDefinitions,
} from '@suite-common/token-definitions';
import { selectAccountByKey } from '@suite-common/wallet-core';

import { AccountSelectBottomSheetSection } from '../types';
import { createMemoizedSelector } from './common';
import { getAccountListSections } from './getAccountListSections';

const EMPTY_ARRAY: AccountSelectBottomSheetSection[] = [];

export const selectAccountListSections = createMemoizedSelector(
    [selectAccountByKey, selectTokenDefinitions],
    (account, tokenDefinitions) => {
        if (!account) return EMPTY_ARRAY;

        const networkTokenDefinitions = getSimpleCoinDefinitionsByNetwork(
            tokenDefinitions,
            account.symbol,
        );

        return getAccountListSections(account, networkTokenDefinitions);
    },
);
