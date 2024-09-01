// import { TokenDefinitionsRootState } from '@suite-common/token-definitions';
// import { NetworkSymbol } from '@suite-common/wallet-config';
// import { AccountsRootState, DeviceRootState, selectAccountByKey } from '@suite-common/wallet-core';

// import {
//     selectNumberOfEthereumAccountTokensWithFiatRates,
//     selectNumberOfUniqueEthereumTokensPerDevice,
// } from './ethereumTokensSelectors';
// import { isCoinWithTokens } from './utils';

// export const selectNumberOfUniqueTokensForCoinPerDevice = (
//     state: AccountsRootState & DeviceRootState & TokenDefinitionsRootState,
//     coin: NetworkSymbol,
// ) => {
//     if (!isCoinWithTokens(coin)) return 0;

//     switch (coin) {
//         case 'eth':
//             return selectNumberOfUniqueEthereumTokensPerDevice(state);
//         default:
//             // Exhaustive check, all coin types in NETWORKS_WITH_TOKENS should be handled above
//             coin satisfies never;

//             return 0;
//     }
// };

// export const selectNumberOfAccountTokensWithFiatRates = (
//     state: AccountsRootState & TokenDefinitionsRootState,
//     accountKey: string,
// ) => {
//     const account = selectAccountByKey(state, accountKey);

//     if (!account || !isCoinWithTokens(account.symbol)) return 0;

//     switch (account.symbol) {
//         case 'eth':
//             return selectNumberOfEthereumAccountTokensWithFiatRates(state, accountKey);
//         default:
//             // Exhaustive check, all coin types in NETWORKS_WITH_TOKENS should be handled above
//             account.symbol satisfies never;

//             return 0;
//     }
// };

// export const selectAccountHasAnyTokensWithFiatRates = (
//     state: AccountsRootState & TokenDefinitionsRootState,
//     accountKey: string,
// ) => {
//     return selectNumberOfAccountTokensWithFiatRates(state, accountKey) > 0;
// };

// Temporary solution until we solve performance issues with token definitions

export const selectNumberOfUniqueTokensForCoinPerDevice = (_state: any, _coin: any) => {
    return 1;
};

export const selectNumberOfAccountTokensWithFiatRates = (_state: any, _accountKey: any) => {
    return 1;
};

export const selectAccountHasAnyTokensWithFiatRates = (_state: any, _accountKey: any) => {
    return true;
};
