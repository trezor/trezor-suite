import { type ReactNode, useMemo } from 'react';

import { type Account } from '@suite-common/wallet-types';

import { AccountLabel } from '../../AccountLabel';
import { ASSET_ROW_GROUP_LABEL_HEIGHT, ASSET_ROW_HEIGHTS_BY_SIZE } from '../constants';
import { type AccountWithTokensOption, type AssetGroupSpaceSize } from '../types';

export type AssetPickerListItem =
    | AccountWithTokensOption
    | {
          type: 'group-label';
          label: ReactNode;
          height: number;
      }
    | {
          type: 'group-space';
          height: number;
          size: AssetGroupSpaceSize;
      };

export function useInsertGroupLabelsAndSpaces(
    accountsWithTokens: AccountWithTokensOption[],
): AssetPickerListItem[] {
    return useMemo(() => {
        const list: AssetPickerListItem[] = [];
        let currentAccount: Account | null = null;

        for (const item of accountsWithTokens) {
            // New account -> insert group label and some group padding
            if (currentAccount !== item.account) {
                if (currentAccount) {
                    list.push({
                        type: 'group-space',
                        height: ASSET_ROW_HEIGHTS_BY_SIZE['md'],
                        size: 'md',
                    });
                }

                list.push({
                    type: 'group-label',
                    label: <AccountLabel account={item.account} showAccountTypeBadge={true} />,
                    height: ASSET_ROW_GROUP_LABEL_HEIGHT,
                });

                currentAccount = item.account;
            }

            list.push(item);
        }

        return list;
    }, [accountsWithTokens]);
}
