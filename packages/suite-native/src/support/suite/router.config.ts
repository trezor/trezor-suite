import Dashboard from '@native/views/dashboard';

import AccountTransactions from '@native/views/wallet';
import AccountReceive from '@native/views/wallet/receive';
import AccountSend from '@native/views/wallet/send';
import AccountSignVerify from '@native/views/wallet/sign-verify';

import Passwords from '@native/views/passwords';

import SettingsGeneral from '@native/views/settings';
import SettingsDevice from '@native/views/settings/device';
import SettingsCoins from '@native/views/settings/coins';

import Onboarding from '@native/views/suite/onboarding';
import Firmware from '@native/views/suite/firmware';
import Backup from '@native/views/suite/backup';
import SwitchDevice from '@native/views/suite/switch-device';

import TabsBar from '@native-components/suite/Tabs';
import Drawer from '@native-components/suite/Drawer';
import HeaderLeft from '@native-components/suite/Header';

import { getRoute } from '@suite-utils/router';

const defaultNavigatorsViews = {
    drawer: Drawer,
    headerLeft: HeaderLeft,
    tabs: TabsBar,
};

export default [
    {
        key: getRoute('suite-index'),
        type: 'drawer',
        screen: Dashboard,
        navigators: defaultNavigatorsViews,
    },
    {
        // TODO, suite is now redirecting to suite-welcome screen, what is the correct screen to show in RN?
        key: getRoute('suite-welcome'),
        type: 'drawer',
        screen: Onboarding,
        navigators: defaultNavigatorsViews,
    },
    {
        key: getRoute('wallet-index'),
        type: 'tabs',
        tabs: [
            { key: getRoute('wallet-index'), screen: AccountTransactions },
            { key: getRoute('wallet-receive'), screen: AccountReceive },
            { key: getRoute('wallet-send'), screen: AccountSend },
            { key: getRoute('wallet-sign-verify'), screen: AccountSignVerify },
        ],
        navigators: defaultNavigatorsViews,
    },
    {
        key: getRoute('passwords-index'),
        type: 'drawer',
        screen: Passwords,
        navigators: defaultNavigatorsViews,
    },
    {
        key: getRoute('settings-index'),
        type: 'tabs',
        tabs: [
            { key: getRoute('settings-index'), screen: SettingsGeneral },
            { key: getRoute('settings-device'), screen: SettingsDevice },
            { key: getRoute('settings-coins'), screen: SettingsCoins },
        ],
        navigators: defaultNavigatorsViews,
    },
    {
        key: getRoute('onboarding-index'),
        type: 'default',
        screen: Onboarding,
    },
    {
        key: getRoute('firmware-index'),
        type: 'default',
        screen: Firmware,
    },
    {
        key: getRoute('settings-device'),
        type: 'default',
        screen: Backup,
    },
    {
        key: getRoute('suite-switch-device'),
        type: 'default',
        screen: SwitchDevice,
    },
] as const;
