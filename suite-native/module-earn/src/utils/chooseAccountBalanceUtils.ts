import { type Account, toTokenAddress } from '@suite-common/wallet-types';
import { isWrappedNativeToken } from '@trezor/network-ethereum-suite-common';

import { type ChooseAccountTokenBalance } from '../types';
import {
    getAccountTokenByContract,
    getYieldVaultDepositableBalance,
} from './contractTokenBalanceUtils';

export type ChooseAccountBalanceData =
    | {
          type: 'account';
          value: string;
      }
    | {
          type: 'token';
          value: string;
          tokenContractAddress: ChooseAccountTokenBalance['tokenContractAddress'];
          tokenSymbol: ChooseAccountTokenBalance['tokenSymbol'];
      };

export const getChooseAccountBalanceData = (
    account: Account,
    tokenBalance?: ChooseAccountTokenBalance,
): ChooseAccountBalanceData => {
    if (!tokenBalance) {
        return {
            type: 'account',
            value: account.formattedBalance,
        };
    }

    // A wrapped-native (WETH) vault can also spend the wrappable native balance, so the
    // depositable amount is denominated as the native asset — which also makes the fiat
    // conversion use the native rate.
    if (isWrappedNativeToken(account.symbol, tokenBalance.tokenContractAddress)) {
        return {
            type: 'account',
            value: getYieldVaultDepositableBalance(account, tokenBalance.tokenContractAddress),
        };
    }

    const token = getAccountTokenByContract(account, tokenBalance.tokenContractAddress);

    return {
        type: 'token',
        value: token?.balance ?? '0',
        tokenContractAddress: token
            ? toTokenAddress(token.contract)
            : tokenBalance.tokenContractAddress,
        tokenSymbol: tokenBalance.tokenSymbol,
    };
};
