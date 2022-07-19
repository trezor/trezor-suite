import { ModalAppParams, WalletParams } from '@suite-common/wallet-types';
import { Network } from '@suite-common/wallet-networks-config';
import { ArrayElement, ConstWithOptionalFields } from '@trezor/type-utils';
import { routes } from '@suite-common/suite-config';

export type RouteParams = WalletParams | ModalAppParams;

type RouteKeys =
    | keyof ArrayElement<typeof routes>
    | 'params'
    | 'exact'
    | 'isForegroundApp'
    | 'isFullscreenApp';
export type Route = ArrayElement<ConstWithOptionalFields<typeof routes, RouteKeys>>;
export type SettingsBackRoute = {
    name: Route['name'];
    params?: RouteParams;
};

type RouteParamsTypes = {
    symbol: Network['symbol'];
    accountIndex: number;
    accountType: NonNullable<Network['accountType']>;
    cancelable: boolean;
};

type ExtractType<T extends keyof RouteParamsTypes> = {
    [P in T]: RouteParamsTypes[P];
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
