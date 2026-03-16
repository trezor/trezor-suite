import { type routes } from '@suite-common/suite-config';
import { type ArrayElement, type ConstWithOptionalFields, type Keys } from '@trezor/type-utils';

type RouteKeys = Keys<ArrayElement<typeof routes>>;

export type Route = ArrayElement<ConstWithOptionalFields<typeof routes, RouteKeys>>;

export type PageName = Exclude<Route, { isForegroundApp: true } | { isNestedRoute: true }>['name'];
