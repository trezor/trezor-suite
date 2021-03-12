import Dashboard from '@dashboard-views';

import AccountTransactions from '@wallet-views';
import AccountReceive from '@wallet-views/receive';
import AccountSend from '@wallet-views/send';
import AccountSignVerify from '@wallet-views/sign-verify';

import Passwords from '@passwords-views';

import SettingsGeneral from '@settings-views';
import SettingsDevice from '@settings-views/device';
import SettingsCoins from '@settings-views/coins';

import Onboarding from '@suite-views/onboarding';
import Firmware from '@suite-views/firmware';
import Backup from '@suite-views/backup';
import SwitchDevice from '@suite-views/switch-device';

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
        // TODO, suite is now redirecting to onboarding-index screen, what is the correct screen to show in RN?
        key: getRoute('onboarding-index'),
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
