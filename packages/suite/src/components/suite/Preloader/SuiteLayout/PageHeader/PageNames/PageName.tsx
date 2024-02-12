import { useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

import { SettingsName } from './SettingsName';
import { BasicName } from './BasicName';
import { AccountName } from './AccountName/AccountName';

export const PageName = () => {
    const currentRoute = useSelector(state => state.router.route?.name);
    const selectedAccount = useSelector(state => selectSelectedAccount(state));

    // TODO: does not work properly with foreground apps, e.g. FW update
    if (currentRoute?.includes('settings')) {
        return <SettingsName nameId="TR_SETTINGS" />;
    }

    if (selectedAccount) {
        return <AccountName selectedAccount={selectedAccount} />;
    }

    return <BasicName nameId="TR_DASHBOARD" />;
};
