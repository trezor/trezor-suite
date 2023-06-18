import { ArrayElement, ConstWithOptionalFields } from '@trezor/type-utils';
import { Network } from 'src/types/wallet';
import routes from 'src/config/suite/routes';
import { RouteParams } from 'src/utils/suite/router';

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

export default [...routes] as Route[];
