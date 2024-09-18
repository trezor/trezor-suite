import { AccountItem } from '@suite-common/graph';
import {
    selectFilterKnownTokens,
    TokenDefinitionsRootState,
} from '@suite-common/token-definitions';
import {
    AccountsRootState,
    DeviceRootState,
    selectDeviceMainnetAccounts,
} from '@suite-common/wallet-core';
import { TokenAddress } from '@suite-common/wallet-types';
import { tryGetAccountIdentity } from '@suite-common/wallet-utils';

type GraphCommonRootState = DeviceRootState & AccountsRootState & TokenDefinitionsRootState;

export const selectPortfolioGraphAccountItems = (state: GraphCommonRootState): AccountItem[] => {
    const accounts = selectDeviceMainnetAccounts(state);

    return accounts.map(account => {
        const knownTokens = account.tokens
            ? selectFilterKnownTokens(state, account.symbol, account.tokens)
            : undefined;
        const tokensFilter = knownTokens?.map(token => token.contract as TokenAddress);

        return {
            coin: account.symbol,
            descriptor: account.descriptor,
            identity: tryGetAccountIdentity(account),
            accountKey: account.key,
            tokensFilter,
        };
    });
};
