import { selectLanguage } from '@suite/settings';
import {
    type EarnDashboardType,
    useMessageSystemEarnDashboard as useMessageSystemEarnDashboardCore,
} from '@suite-common/message-system';

import { useSelector } from './useSelector';

export type { EarnDashboardType };

export const useMessageSystemEarnDashboard = (type: EarnDashboardType) => {
    const locale = useSelector(selectLanguage);

    return useMessageSystemEarnDashboardCore({ type, locale });
};
