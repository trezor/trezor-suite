import { ArrayElement } from '@trezor/type-utils';
import { Route } from '@suite-common/suite-types';
import { routes } from '@suite-common/suite-config';

import { Network } from 'src/types/wallet';
import { RouteParams } from 'src/utils/suite/router';

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
