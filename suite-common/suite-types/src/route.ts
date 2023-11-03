import { ArrayElement, ConstWithOptionalFields } from '@trezor/type-utils';
import { routes } from '@suite-common/suite-config';

type RouteKeys =
    | keyof ArrayElement<typeof routes>
    | 'params'
    | 'exact'
    | 'isForegroundApp'
    | 'isFullscreenApp';

export type Route = ArrayElement<ConstWithOptionalFields<typeof routes, RouteKeys>>;

export type PageName = Exclude<Route, { isForegroundApp: true }>['name'];
