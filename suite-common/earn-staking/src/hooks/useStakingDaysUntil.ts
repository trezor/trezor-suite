import { useNow } from '@trezor/react-utils';

import { getStakingDaysUntil } from '../utils/getStakingDaysUntil';

const DAY_COUNT_REFRESH_INTERVAL_MS = 60 * 60 * 1000;

export const useStakingDaysUntil = (timestamp: number | null): number | null => {
    const now = useNow(DAY_COUNT_REFRESH_INTERVAL_MS);

    return timestamp === null ? null : getStakingDaysUntil(timestamp, now);
};
