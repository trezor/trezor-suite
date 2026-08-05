import React from 'react';

import { type IsAny, type UnionToIntersection } from '@trezor/type-utils';

import { type Getter } from './toGetter';

const ServicesContext = React.createContext<any>(null);

// This is intentional `any`. Services cannot be known in advance,
// doing some global super type would create same complication as we
// currently have in the `ExtraDependenciesStatic` type, where
// we have central place where _everything_ must be imported.
type Services = any;

export type ServiceSelector<TSelected> = (services: Services) => TSelected;

export type SelectorResult<TSelector> =
    TSelector extends ServiceSelector<infer TSelected> ? TSelected : never;

export type SelectedServices<TSelectors extends readonly ServiceSelector<any>[]> =
    UnionToIntersection<SelectorResult<TSelectors[number]>>;

type GetterKeys<TSelected> = {
    [K in keyof TSelected]-?: TSelected[K] extends Getter<any[], any> ? K : never;
}[keyof TSelected];

/**
 * Getters are deliberately unreachable through `useServices`: a getter called during render is read
 * once and the component never re-renders when the value changes. `useGetter` subscribes instead.
 *
 * Resolving to a string makes the call site fail on the very first property access, with the reason
 * spelled out in the reported type.
 */
type RejectGetters<TSelected> =
    IsAny<TSelected> extends true
        ? TSelected
        : [GetterKeys<TSelected>] extends [never]
          ? TSelected
          : 'This dependency contains a getter. Select the getter on its own and read it with useGetter, or take the whole dependency with the deprecated useImperativeServices if it is only called from event handlers.';

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

export const useServicesContext = (): Services => {
    const services = React.useContext(ServicesContext);

    if (!services) {
        throw new Error('useServices must be used within a ServicesProvider');
    }

    return services;
};

const useSelectedServices = (selectors: ServiceSelector<any>[]) => {
    const services = useServicesContext();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    return React.useMemo(() => selectServices(services, ...selectors), [services, ...selectors]);
};

export function useServices<
    const TSelectors extends readonly [ServiceSelector<any>, ...ServiceSelector<any>[]],
>(...selectors: TSelectors): RejectGetters<SelectedServices<TSelectors>>;

export function useServices(...selectors: ServiceSelector<any>[]) {
    return useSelectedServices(selectors);
}

/**
 * `useServices` for dependencies that do contain getters, which it otherwise refuses to hand out.
 *
 * @deprecated Select the individual services instead. Getters and plain services are consumed
 * differently — a getter holds a value that changes over time and has to be subscribed to with
 * `useGetter`, while a service is just called — so a dependency lumping both together cannot be
 * consumed correctly as a whole. This exists for bags that are only passed on and called from event
 * handlers, where nothing is read during render; anything else will silently miss state changes.
 */
export function useImperativeServices<
    const TSelectors extends readonly [ServiceSelector<any>, ...ServiceSelector<any>[]],
>(...selectors: TSelectors): SelectedServices<TSelectors>;

export function useImperativeServices(...selectors: ServiceSelector<any>[]) {
    return useSelectedServices(selectors);
}
