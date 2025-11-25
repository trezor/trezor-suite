import { ReactNode, useMemo } from 'react';

import { Account } from '@suite-common/wallet-types';

import { AccountLabel } from 'src/components/suite/AccountLabel';
import {
    ASSET_ROW_GROUP_LABEL_HEIGHT,
    ASSET_ROW_HEIGHTS_BY_SIZE,
} from 'src/components/suite/asset-picker/constants';

import { AccountWithTokensOption } from './useAccountWithTokensOptions';

export type GlobalSendListItem =
    | AccountWithTokensOption
    | {
          type: 'group-label';
          label: ReactNode;
          height: number;
      }
    | {
          type: 'group-space';
          height: number;
      };

export function useInsertGroupLabelsAndSpaces(
    accountsWithTokens: AccountWithTokensOption[],
): GlobalSendListItem[] {
    return useMemo(() => {
        const list: GlobalSendListItem[] = [];
        let currentAccount: Account | null = null;

        for (const item of accountsWithTokens) {
            switch (item.type) {
                case 'account': {
                    // New account -> insert group label and some group padding
                    if (currentAccount !== item.account) {
                        if (currentAccount) {
                            list.push({
                                type: 'group-space',
                                height: ASSET_ROW_HEIGHTS_BY_SIZE['md'],
                            });
                        }

                        list.push({
                            type: 'group-label',
                            label: (
                                <AccountLabel account={item.account} showAccountTypeBadge={true} />
                            ),
                            height: ASSET_ROW_GROUP_LABEL_HEIGHT,
                        });

                        currentAccount = item.account;
                    }

                    list.push(item);

                    continue;
                }

                case 'token':
                    list.push(item);
                    continue;
            }
        }

        return list;
    }, [accountsWithTokens]);
}
