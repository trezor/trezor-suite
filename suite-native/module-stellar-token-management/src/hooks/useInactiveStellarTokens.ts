import { useSelector } from 'react-redux';

import { useStellarInactiveTokens } from '@suite-common/stellar-queries';
import {
    type TokenDefinitionsRootState,
    selectCoinDefinitions,
} from '@suite-common/token-definitions';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';

export const useInactiveStellarTokens = (accountKey?: AccountKey) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const coinDefinitions = useSelector((state: TokenDefinitionsRootState) =>
        selectCoinDefinitions(state, account?.symbol ?? asNetworkSymbol('xlm')),
    );

    // Mobile offers the tokens the coin definitions in the store already list; the published
    // metadata only says what each of them is called.
    const { inactiveTokens, isLoading: isMetadataLoading } = useStellarInactiveTokens({
        account,
        contracts: coinDefinitions?.data,
    });

    return {
        inactiveTokens,
        isLoading: (coinDefinitions?.isLoading ?? false) || isMetadataLoading,
    };
};
