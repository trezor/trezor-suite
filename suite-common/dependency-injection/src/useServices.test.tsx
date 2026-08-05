import React, { type PropsWithChildren } from 'react';

import { renderHook } from '@testing-library/react';

import { type Getter, asGetter } from './toGetter';
import { ServicesProvider, useServices } from './useServices';

type ADep = { a: () => void };
type BDep = { b: () => void };
type GetterDep = { getSomething: Getter<[], boolean> };

const appServices: ADep & BDep & GetterDep = {
    a: jest.fn(),
    b: jest.fn(),
    getSomething: asGetter(() => true),
};

const selectADep = (services: any): ADep => ({
    a: services.a,
});

const selectBDep = (services: any): BDep => ({
    b: services.b,
});

const selectGetterDep = (services: any): GetterDep => ({
    getSomething: services.getSomething,
});

const wrapper = ({ children }: PropsWithChildren) => (
    <ServicesProvider services={appServices}>{children}</ServicesProvider>
);

describe(useServices.name, () => {
    it('returns the same selected services reference across rerenders', () => {
        const { result, rerender } = renderHook(() => useServices(selectADep, selectBDep), {
            wrapper,
        });

        const firstSelectedServices = result.current;

        rerender();

        expect(result.current).toBe(firstSelectedServices);
    });

    it('refuses to hand out a getter, which has to be read with useGetter', () => {
        const { result } = renderHook(
            // @ts-expect-error a selected getter makes the result unusable, on purpose
            () => useServices(selectGetterDep).getSomething,
            { wrapper },
        );

        // The refusal is type-only: nothing is stripped at runtime.
        expect(result.current).toBe(appServices.getSomething);
    });

    it('refuses a getter selected alongside plain services', () => {
        const { result } = renderHook(
            // @ts-expect-error one getter among plain services is enough to reject the whole result
            () => useServices(selectADep, selectGetterDep).a,
            { wrapper },
        );

        expect(result.current).toBe(appServices.a);
    });
});
