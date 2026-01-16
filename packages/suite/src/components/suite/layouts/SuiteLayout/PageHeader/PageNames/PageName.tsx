import { Translation } from '@suite/intl';

import { useSelector } from 'src/hooks/suite';
import { selectIsAccountTabPage } from 'src/reducers/suite/routerReducer';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

import { AccountName } from './AccountName/AccountName';
import { AccountSubpageName } from './AccountName/AccountSubpageName';
import { BasicName } from './BasicName';
import { SettingsName } from './SettingsName';

export const PageName = () => {
    const currentRoute = useSelector(state => state.router.route?.name);
    const selectedAccount = useSelector(selectSelectedAccount);
    const isAccountTabPage = useSelector(selectIsAccountTabPage);

    // TODO: does not work properly with foreground apps, e.g. FW update,
    // as the `route` does not indicate the current page
    // (however location.pathname does)
    if (currentRoute?.includes('settings')) {
        return <SettingsName />;
    }

    if (currentRoute?.includes('earn')) {
        return (
            <BasicName>
                <Translation id="TR_EARN" />
            </BasicName>
        );
    }

    if (selectedAccount && isAccountTabPage) {
        return <AccountName selectedAccount={selectedAccount} />;
    }
    if (selectedAccount) {
        return <AccountSubpageName selectedAccount={selectedAccount} />;
    }

    return (
        <BasicName>
            <Translation id="TR_DASHBOARD" />
        </BasicName>
    );
};
