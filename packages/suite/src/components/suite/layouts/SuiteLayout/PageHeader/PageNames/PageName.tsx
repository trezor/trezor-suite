import { selectSelectedAccount } from '@suite/account';
import { Translation } from '@suite/intl';
import {
    isAccountTabRoute,
    resolveEffectiveBackgroundRouteName,
    selectRoute,
    selectSuiteRouterHistoryDep,
} from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';

import { useSelector } from 'src/hooks/suite';

import { AccountName } from './AccountName/AccountName';
import { AccountSubpageName } from './AccountName/AccountSubpageName';
import { BasicName } from './BasicName';
import { SettingsName } from './SettingsName';

export const PageName = () => {
    const route = useSelector(selectRoute);
    const { suiteRouterHistory } = useServices(selectSuiteRouterHistoryDep);
    const currentRoute = resolveEffectiveBackgroundRouteName(
        route,
        suiteRouterHistory.getLocation(),
    );
    const selectedAccount = useSelector(selectSelectedAccount);
    const isAccountTabPage = isAccountTabRoute(currentRoute);

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
        return <AccountName key={selectedAccount.key} selectedAccount={selectedAccount} />;
    }

    if (selectedAccount) {
        return <AccountSubpageName key={selectedAccount.key} selectedAccount={selectedAccount} />;
    }

    return (
        <BasicName>
            <Translation id="TR_DASHBOARD" />
        </BasicName>
    );
};
