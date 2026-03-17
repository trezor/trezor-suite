import { type ArrayElement, type ConstWithOptionalFields, type Keys } from '@trezor/type-utils';

import { type routes } from './routeConfig';

type RouteKeys = Keys<ArrayElement<typeof routes>>;

export type Route = ArrayElement<ConstWithOptionalFields<typeof routes, RouteKeys>>;

export type PageName = Exclude<Route, { isForegroundApp: true } | { isNestedRoute: true }>['name'];
