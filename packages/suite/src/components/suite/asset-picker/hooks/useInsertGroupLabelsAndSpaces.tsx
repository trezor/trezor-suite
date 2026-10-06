import { useMemo } from 'react';

import { AccountLabel } from '@suite/account';
import { type Account } from '@suite-common/wallet-types';

import { type AssetPickerListItem, type AssetPickerOption } from '../types';

export function useInsertGroupLabelsAndSpaces(
    accountsWithTokens: AssetPickerOption[],
): AssetPickerListItem[] {
    return useMemo(() => {
        const list: AssetPickerListItem[] = [];
        let currentAccount: Account | null = null;

        for (const item of accountsWithTokens) {
            // New account -> insert group label and some group padding
            if (currentAccount !== item.account) {
                if (currentAccount) {
                    list.push({ type: 'group-space', size: 'md' });
                }

                list.push({
                    type: 'group-label',
                    label: <AccountLabel account={item.account} showAccountTypeBadge={true} />,
                });

                currentAccount = item.account;
            }

            list.push(item);
        }

        return list;
    }, [accountsWithTokens]);
}
