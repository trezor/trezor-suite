import { modalAppParams, routes } from '@suite-common/suite-config';
import { Route } from '@suite-common/suite-types';
import { AccountType, NetworkSymbol } from '@suite-common/wallet-config';
import { WalletParams as CommonWalletParams } from '@suite-common/wallet-types';
import { ArrayElement } from '@trezor/type-utils';

import { type DashboardParams, type EarnParams } from './routerParams';

export type SettingsBackRoute = {
    name: Route['name'];
    params?: RouteParams;
};

type AppParamsTypes = {
    symbol: NetworkSymbol;
    accountIndex: number;
    accountType: NonNullable<AccountType>;
    cancelable: boolean;
    yieldId: string;
    contractAddress?: string;
};

type ExtractType<T extends keyof AppParamsTypes> = {
    [P in T]: AppParamsTypes[P];
};

type ModalAppParams = {
    [key in (typeof modalAppParams)[number]]: string | boolean | undefined;
};

export type RouteParams = {
    [K in keyof (CommonWalletParams &
        EarnParams &
        ModalAppParams &
        DashboardParams)]?: (CommonWalletParams & EarnParams & ModalAppParams & DashboardParams)[K];
};

type AppWithParams<T extends { [key: string]: any }> = {
    [K in keyof T]: {
        app: T[K]['app'];
        route: Route;
        params: ExtractType<ArrayElement<T[K]['params']>> | undefined;
    };
};

export type RouterAppWithParams =
    | ArrayElement<AppWithParams<typeof routes>>
    | {
          app: 'unknown';
          params: undefined;
          route: undefined;
      };

export const suiteRoutes = [...routes] as Route[];
