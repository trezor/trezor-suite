import React from 'react';

import { type UnionToIntersection } from '@trezor/type-utils';

const ServicesContext = React.createContext<any>(null);

// This is intentional `any`. Services cannot be known in advance,
// doing some global super type would create same complication as we
// currently have in the `ExtraDependenciesStatic` type, where
// we have central place where _everything_ must be imported.
type Services = any;

export type ServiceSelector<TSelected> = (services: Services) => TSelected;

type SelectorResult<TSelector> =
    TSelector extends ServiceSelector<infer TSelected> ? TSelected : never;

type SelectedServices<TSelectors extends readonly ServiceSelector<any>[]> = UnionToIntersection<
    SelectorResult<TSelectors[number]>
>;

type ServicesProviderProps = {
    services: Services;
    children: React.ReactNode;
};

export const ServicesProvider = ({ services, children }: ServicesProviderProps) => (
    <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>
);

ServicesProvider.displayName = 'ServicesProvider';

export const selectServices = (services: Services, ...selectors: ServiceSelector<any>[]) =>
    Object.assign({}, ...selectors.map(selector => selector(services)));

export function useServices<
    const TSelectors extends readonly [ServiceSelector<any>, ...ServiceSelector<any>[]],
>(...selectors: TSelectors): SelectedServices<TSelectors>;

export function useServices(...selectors: ServiceSelector<any>[]) {
    const services = React.useContext(ServicesContext);

    if (!services) {
        throw new Error('useServices must be used within a ServicesProvider');
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    return React.useMemo(() => selectServices(services, ...selectors), [services, ...selectors]);
}
