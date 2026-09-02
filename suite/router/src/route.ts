import { type routes } from '@suite/router-config';
import {
    type ArrayElement,
    type ConstWithOptionalFields,
    type KeysOfUnion,
} from '@trezor/type-utils';

export type Routes = typeof routes;

type RouteKeys = KeysOfUnion<ArrayElement<Routes>>;

export type Route = ArrayElement<ConstWithOptionalFields<Routes, RouteKeys>>;

export type PageName = Exclude<Route, { isForegroundApp: true } | { isNestedRoute: true }>['name'];
