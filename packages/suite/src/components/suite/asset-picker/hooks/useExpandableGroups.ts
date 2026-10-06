import { useCallback, useState } from 'react';

import { type AccountKey } from '@suite-common/wallet-types';

export function useExpandableGroups<TGroupKey extends string = AccountKey>() {
    const [expandedGroupKeys, setExpandedGroupKeys] = useState<TGroupKey[]>([]);

    const toggleGroup = useCallback((groupKey: TGroupKey, expanded: boolean) => {
        setExpandedGroupKeys(prev => {
            if (expanded) {
                return prev.concat(groupKey);
            }

            return prev.filter(key => key !== groupKey);
        });
    }, []);

    return {
        expandedGroupKeys,
        toggleGroup,
    } as const;
}
