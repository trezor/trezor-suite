import { useCallback, useState } from 'react';

import { type AccountKey } from '@suite-common/wallet-types';

export function useExpandableAccountGroups<TGroupKey extends string = AccountKey>() {
    const [expandedAccountTokensGroups, setExpandedAccountTokensGroups] = useState<TGroupKey[]>([]);

    const updateExpandableAccountGroups = useCallback((groupKey: TGroupKey, expanded: boolean) => {
        setExpandedAccountTokensGroups(prev => {
            if (expanded) {
                return prev.concat(groupKey);
            }

            return prev.filter(key => key !== groupKey);
        });
    }, []);

    return {
        expandedAccountTokensGroups,
        updateExpandableAccountGroups,
    } as const;
}
