import { getWeakRandomId } from '@trezor/utils';

import { ExperimentIdType } from '../experiments';

// getWeakRandomId is also used for generating instanceId
export const getArrayOfInstanceIds = (count: number) =>
    Array.from({ length: count }, () => getWeakRandomId(10));

export const experimentTest = {
    id: 'e2e8d05f-1469-4e47-9ab0-53544e5cad07' as ExperimentIdType,
    groups: [
        {
            variant: 'A',
            percentage: 20,
        },
        {
            variant: 'B',
            percentage: 80,
        },
    ],
};
