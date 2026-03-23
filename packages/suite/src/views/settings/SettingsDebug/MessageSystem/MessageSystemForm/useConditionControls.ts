import { useCallback, useMemo } from 'react';

import { CONDITION_OPTIONS, getDefaultConditionValue } from '@suite-common/message-system';
import { type Condition } from '@suite-common/suite-types';

type Parsed = { conditions?: unknown[] } | null;

export function useConditionControls(parsedData: Parsed, setFormData: (next: string) => void) {
    const availableConditionOptions = useMemo(() => {
        if (!Array.isArray(parsedData?.conditions) || !parsedData!.conditions![0]) {
            return CONDITION_OPTIONS;
        }
        const head = parsedData!.conditions![0] as Record<keyof Condition, unknown>;
        const used = new Set(Object.keys(head));

        return CONDITION_OPTIONS.filter(o => !used.has(o.value));
    }, [parsedData]);

    const canAddCondition = !!parsedData && availableConditionOptions.length > 0;

    const addCondition = useCallback(
        (conditionKey: keyof Condition) => {
            if (!parsedData) return;

            const defaultValue = getDefaultConditionValue(conditionKey);
            const existing = Array.isArray(parsedData.conditions) ? parsedData.conditions : [];
            const head = (existing[0] ?? {}) as Record<string, unknown>;

            if (Object.prototype.hasOwnProperty.call(head, conditionKey)) return;

            const updatedHead = { ...head, [conditionKey]: defaultValue };
            const next = {
                ...(parsedData as object),
                conditions: [updatedHead, ...existing.slice(1)],
            };

            setFormData(JSON.stringify(next, null, 2));
        },
        [parsedData, setFormData],
    );

    return { availableConditionOptions, canAddCondition, addCondition };
}
