import Dashboard from '@dashboard-views';

import AccountTransactions from '@wallet-views';
import AccountReceive from '@wallet-views/receive';
import AccountSend from '@wallet-views/send';
import AccountSignVerify from '@wallet-views/sign-verify';

import Exchange from '@exchange-views';
import Passwords from '@passwords-views';

import SettingsGeneral from '@settings-views';
import SettingsDevice from '@settings-views/device';
import SettingsWallet from '@settings-views/wallet';

import Onboarding from '@suite-views/onboarding';
import Firmware from '@suite-views/firmware';
import Backup from '@suite-views/backup';
import SwitchDevice from '@suite-views/switch-device';

import TabsBar from '@suite-components/Tabs';
import Drawer from '@suite-components/Drawer';
import HeaderLeft from '@suite-components/Header';

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
        key: getRoute('wallet-index'),
        type: 'tabs',
        tabs: [
            { key: getRoute('wallet-index'), screen: AccountTransactions },
            { key: getRoute('wallet-account-receive'), screen: AccountReceive },
            { key: getRoute('wallet-account-send'), screen: AccountSend },
            { key: getRoute('wallet-account-sign-verify'), screen: AccountSignVerify },
        ],
        navigators: defaultNavigatorsViews,
    },
    {
        key: getRoute('exchange-index'),
        type: 'drawer',
        screen: Exchange,
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
            { key: getRoute('settings-wallet'), screen: SettingsWallet },
        ],
        navigators: defaultNavigatorsViews,
    },
    {
        key: getRoute('onboarding-index'),
        type: 'default',
        screen: Onboarding,
    },
    {
        key: getRoute('suite-device-firmware'),
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
