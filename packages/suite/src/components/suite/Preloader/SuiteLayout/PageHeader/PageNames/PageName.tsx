import { useSelector } from 'src/hooks/suite';

import { SettingsName } from './SettingsName';
import { BasicName } from './BasicName';

export const PageName = () => {
    const currentRoute = useSelector(state => state.router.route?.name);

    // TODO: does not work properly with foreground apps, e.g. FW update
    if (currentRoute?.includes('settings')) {
        return <SettingsName nameId="TR_SETTINGS" />;
    }

    return <BasicName nameId="TR_DASHBOARD" />;
};
