import { type Account, toTokenAddress } from '@suite-common/wallet-types';

import { type ChooseAccountTokenBalance } from '../types';
import { getAccountTokenByContract } from './contractTokenBalanceUtils';

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
