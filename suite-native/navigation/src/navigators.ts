import { NavigatorScreenParams } from '@react-navigation/native';

import { XpubAddress } from '@suite-common/wallet-types';
import { NetworkSymbol } from '@suite-common/wallet-config';

import {
    AppTabsRoutes,
    AccountsImportStackRoutes,
    HomeStackRoutes,
    RootStackRoutes,
    SettingsStackRoutes,
    AccountsStackRoutes,
    DevUtilsStackRoutes,
} from './routes';

export type HomeStackParamList = {
    [HomeStackRoutes.Home]: undefined;
};

export type DevUtilsStackParamList = {
    [DevUtilsStackRoutes.DevUtils]: undefined;
    [DevUtilsStackRoutes.Demo]: undefined;
};

export type SettingsStackParamList = {
    [SettingsStackRoutes.Settings]: undefined;
    [SettingsStackRoutes.SettingsLocalisation]: undefined;
    [SettingsStackRoutes.SettingsCustomization]: undefined;
};

export type AccountsStackParamList = {
    [AccountsStackRoutes.Accounts]: undefined;
    [AccountsStackRoutes.AccountDetail]: { accountKey: string };
    [AccountsStackRoutes.AccountDetailSettings]: { accountKey: string };
};

export type AppTabsParamList = {
    [AppTabsRoutes.HomeStack]: NavigatorScreenParams<HomeStackParamList>;
    [AppTabsRoutes.AccountsStack]: NavigatorScreenParams<AccountsStackParamList>;
    [AppTabsRoutes.ReceiveScreen]: undefined;
    [AppTabsRoutes.SettingsStack]: NavigatorScreenParams<SettingsStackParamList>;
};

export type AccountsImportStackParamList = {
    [AccountsImportStackRoutes.SelectNetwork]: undefined;
    [AccountsImportStackRoutes.XpubScan]: {
        qrCode?: string;
        networkSymbol: NetworkSymbol;
    };
    [AccountsImportStackRoutes.XpubScanModal]: {
        networkSymbol: NetworkSymbol;
    };
    [AccountsImportStackRoutes.AccountImport]: {
        xpubAddress: XpubAddress;
        networkSymbol: NetworkSymbol;
    };
};

export type RootStackParamList = {
    [RootStackRoutes.AppTabs]: NavigatorScreenParams<AppTabsParamList>;
    [RootStackRoutes.AccountsImport]: NavigatorScreenParams<AccountsImportStackParamList>;
    [RootStackRoutes.AccountSettings]: { accountKey: string };
    [RootStackRoutes.TransactionDetail]: { txid: string };
    [RootStackRoutes.DevUtilsStack]: undefined;
    [RootStackRoutes.ReceiveModal]: { accountKey: string };
};
