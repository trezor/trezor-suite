import React, { type PropsWithChildren } from 'react';

import { renderHook } from '@testing-library/react';

import { ServicesProvider, useServices } from './useServices';

type ADep = { a: () => void };
type BDep = { b: () => void };

const appServices: ADep & BDep = {
    a: jest.fn(),
    b: jest.fn(),
};

const selectADep = (services: any): ADep => ({
    a: services.a,
});

const selectBDep = (services: any): BDep => ({
    b: services.b,
});

describe(useServices.name, () => {
    it('returns the same selected services reference across rerenders', () => {
        const wrapper = ({ children }: PropsWithChildren) => (
            <ServicesProvider services={appServices}>{children}</ServicesProvider>
        );

        const { result, rerender } = renderHook(() => useServices(selectADep, selectBDep), {
            wrapper,
        });

        const firstSelectedServices = result.current;

        rerender();

        expect(result.current).toBe(firstSelectedServices);
    });
});
