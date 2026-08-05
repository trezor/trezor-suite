import React, { type PropsWithChildren } from 'react';

import { renderHook } from '@testing-library/react';

import { type Getter, asGetter } from './toGetter';
import { ServicesProvider, useImperativeServices, useServices } from './useServices';

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
});

describe(useImperativeServices.name, () => {
    it('hands out a dependency containing a getter', () => {
        const { result } = renderHook(() => useImperativeServices(selectGetterDep), { wrapper });

        expect(result.current.getSomething).toBe(appServices.getSomething);
    });
});
