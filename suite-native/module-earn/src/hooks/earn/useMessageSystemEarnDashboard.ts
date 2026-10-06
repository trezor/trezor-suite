import { useSelector } from 'react-redux';

import {
    type EarnDashboardType,
    useMessageSystemEarnDashboard as useMessageSystemEarnDashboardCore,
} from '@suite-common/message-system';
import { selectLocale } from '@suite-native/intl';

export const useMessageSystemEarnDashboard = (type: EarnDashboardType) => {
    const locale = useSelector(selectLocale);

    return useMessageSystemEarnDashboardCore({ type, locale });
};
