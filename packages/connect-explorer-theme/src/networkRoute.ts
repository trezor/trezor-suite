import type { Branded } from '@trezor/type-utils';

/** Network folder name in Explorer routes, such as `bitcoin` in `/methods/bitcoin/`. */
export type NetworkRoute = string & Branded<'NetworkRoute'>;

export const asNetworkRoute = <TRoute extends string>(route: TRoute): TRoute & NetworkRoute =>
    route as TRoute & NetworkRoute;
