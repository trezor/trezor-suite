import { useCallback, useState } from 'react';

import { type AccountKey } from '@suite-common/wallet-types';

export function useExpandableAccountGroups() {
    const [expandedAccountTokensGroups, setExpandedAccountTokensGroups] = useState<AccountKey[]>(
        [],
    );

    const updateExpandableAccountGroups = useCallback(
        (accountKey: AccountKey, expanded: boolean) => {
            setExpandedAccountTokensGroups(prev => {
                if (expanded) {
                    return prev.concat(accountKey);
                }

                return prev.filter(key => key !== accountKey);
            });
        },
        [],
    );

    return {
        expandedAccountTokensGroups,
        updateExpandableAccountGroups,
    } as const;
}
