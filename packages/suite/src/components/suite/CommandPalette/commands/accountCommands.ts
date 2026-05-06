import { type Dispatch } from 'redux';

import { goto } from '@suite/router';
import { type Account } from '@suite-common/wallet-types';

import { type Command, CommandCategory } from './types';

type AccountCommandsParams = {
    dispatch: Dispatch;
    accounts: Account[];
    getDefaultAccountLabel: (params: {
        accountType: Account['accountType'];
        symbol: Account['symbol'];
        index: number;
    }) => string;
};

export const getAccountCommands = ({
    dispatch,
    accounts,
    getDefaultAccountLabel,
}: AccountCommandsParams): Command[] =>
    accounts.map(account => {
        const label = getDefaultAccountLabel({
            accountType: account.accountType,
            symbol: account.symbol,
            index: account.index,
        });

        return {
            id: `account-${account.key}`,
            label,
            description: `${account.symbol.toUpperCase()} \u2022 ${account.formattedBalance}`,
            category: CommandCategory.Account,
            icon: 'wallet',
            keywords: [account.symbol, label.toLowerCase(), account.accountType],
            execute: () =>
                dispatch(
                    goto({
                        routeName: 'wallet-index',
                        params: {
                            symbol: account.symbol,
                            accountIndex: account.index,
                            accountType: account.accountType,
                        },
                    }),
                ),
        };
    });
