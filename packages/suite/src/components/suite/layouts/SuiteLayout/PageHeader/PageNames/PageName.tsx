import { selectSelectedAccount } from '@suite/account';
import { Translation } from '@suite/intl';
import {
    injectSuiteRouterHistory,
    isAccountTabRoute,
    resolveEffectiveBackgroundRouteName,
    selectRoute,
} from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { ExperimentId, useExperiment } from '@suite-common/message-system';

import { useSelector } from 'src/hooks/suite';

import { AccountName } from './AccountName/AccountName';
import { AccountSubpageName } from './AccountName/AccountSubpageName';
import { BasicName } from './BasicName';
import { HiddenTokensName } from './HiddenTokensName';
import { SettingsName } from './SettingsName';

export const PageName = () => {
    const { activeExperimentVariant } = useExperiment(ExperimentId.assetFirstHomeTable);
    const route = useSelector(selectRoute);
    const { suiteRouterHistory } = useServices(injectSuiteRouterHistory);
    const currentRoute = resolveEffectiveBackgroundRouteName(
        route,
        suiteRouterHistory.getLocation(),
    );
    const selectedAccount = useSelector(selectSelectedAccount);
    const isAccountTabPage = isAccountTabRoute(currentRoute);

    // TODO: does not work properly with foreground apps, e.g. FW update,
    // as the `route` does not indicate the current page
    // (however location.pathname does)
    if (currentRoute === 'suite-hidden-tokens') {
        return <HiddenTokensName />;
    }

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

    if (currentRoute === 'notifications-index') {
        return (
            <BasicName>
                <Translation id="TR_NOTIFICATIONS" />
            </BasicName>
        );
    }

    if (selectedAccount && isAccountTabPage) {
        return <AccountName key={selectedAccount.key} selectedAccount={selectedAccount} />;
    }

    if (selectedAccount) {
        return <AccountSubpageName key={selectedAccount.key} selectedAccount={selectedAccount} />;
    }

    // The page is the Home the asset-first table makes of it, and the Dashboard it is otherwise:
    // the name follows what the experiment put on the page.
    return (
        <BasicName>
            <Translation
                id={activeExperimentVariant?.variant === 'B' ? 'TR_HOME' : 'TR_DASHBOARD'}
            />
        </BasicName>
    );
};
