import { routes } from '@suite-common/suite-config';
import { ArrayElement, ConstWithOptionalFields, Keys } from '@trezor/type-utils';

type RouteKeys = Keys<ArrayElement<typeof routes>>;

export type Route = ArrayElement<ConstWithOptionalFields<typeof routes, RouteKeys>>;

export type PageName = Exclude<Route, { isForegroundApp: true } | { isNestedRoute: true }>['name'];
