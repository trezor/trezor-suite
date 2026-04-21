import { type routes } from '@suite/router-config';
import {
    type ArrayElement,
    type ConstWithOptionalFields,
    type KeysOfUnion,
} from '@trezor/type-utils';

type RouteKeys = KeysOfUnion<ArrayElement<typeof routes>>;

export type Route = ArrayElement<ConstWithOptionalFields<typeof routes, RouteKeys>>;

export type PageName = Exclude<Route, { isForegroundApp: true } | { isNestedRoute: true }>['name'];
