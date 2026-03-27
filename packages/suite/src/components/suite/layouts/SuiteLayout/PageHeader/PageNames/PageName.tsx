import { Translation } from '@suite/intl';
import { selectEffectiveRouteName, selectIsAccountTabPageWithLocation } from '@suite/router';
import { selectDeviceAccountForNetworkSymbolAndAccountTypeWithIndex } from '@suite-common/wallet-core';

import { useCurrentHistoryLocation, useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

import { AccountName } from './AccountName/AccountName';
import { AccountSubpageName } from './AccountName/AccountSubpageName';
import { BasicName } from './BasicName';
import { SettingsName } from './SettingsName';

export const PageName = () => {
    const location = useCurrentHistoryLocation();

    const selectedAccount = useSelector(selectSelectedAccount);
    const effectiveRouteName = useSelector(state => selectEffectiveRouteName(state, location));
    const isAccountTabPage = useSelector(state =>
        selectIsAccountTabPageWithLocation(state, location),
    );
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
    if (effectiveRouteName?.includes('settings')) {
        return <SettingsName />;
    }

    if (effectiveRouteName?.includes('earn')) {
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

    if (fallbackAccount) {
        return <AccountName key={fallbackAccount.key} selectedAccount={fallbackAccount} />;
    }

    return (
        <BasicName>
            <Translation id="TR_DASHBOARD" />
        </BasicName>
    );
};
