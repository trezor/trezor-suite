import { Translation } from '@suite/intl';
import { selectDeviceAccountForNetworkSymbolAndAccountTypeWithIndex } from '@suite-common/wallet-core';

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
    const { params } = useSelector(state => state.wallet.selectedAccount);

    const fallbackAccount = useSelector(state =>
        selectDeviceAccountForNetworkSymbolAndAccountTypeWithIndex(
            state,
            params?.symbol,
            params?.accountType,
            params?.accountIndex,
        ),
    );

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

    if (fallbackAccount) {
        return <AccountName selectedAccount={fallbackAccount} />;
    }

    return (
        <BasicName>
            <Translation id="TR_DASHBOARD" />
        </BasicName>
    );
};
