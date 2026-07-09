import { getConvertedOutputTokenBalanceToInputTokenAmount } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

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
    const receiptToken = getAccountTokenByContract(
        account,
        tokenBalance.receiptTokenContract ?? null,
    );

    if (receiptToken && tokenBalance.token) {
        return {
            type: 'token',
            value: getConvertedOutputTokenBalanceToInputTokenAmount({
                networkSymbol: account.symbol,
                token: tokenBalance.token,
                outputToken: tokenBalance.outputToken,
                outputTokenBalance: receiptToken.balance,
                pricePerShareState: tokenBalance.pricePerShareState,
            }),
            tokenContractAddress: tokenBalance.tokenContractAddress,
            tokenSymbol: tokenBalance.tokenSymbol,
        };
    }

    return {
        type: 'token',
        value: token?.balance ?? '0',
        tokenContractAddress: tokenBalance.tokenContractAddress,
        tokenSymbol: tokenBalance.tokenSymbol,
    };
};
