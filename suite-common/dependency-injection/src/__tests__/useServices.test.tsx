/* eslint-disable import/no-extraneous-dependencies */
import React, { type PropsWithChildren } from 'react';

import { renderHook } from '@testing-library/react';

import { ServicesProvider, useServices } from '../useServices';

const services = {
    a: jest.fn(),
    b: jest.fn(),
};

const selectADep = (currentServices: any) => ({
    analytics: currentServices.analytics,
});

const selectBDep = (currentServices: any) => ({
    turnOffSuiteSync: currentServices.suiteSync.turnOffSuiteSync,
});

describe(useServices.name, () => {
    it('returns the same selected services reference across rerenders', () => {
        const wrapper = ({ children }: PropsWithChildren) => (
            <ServicesProvider services={services}>{children}</ServicesProvider>
        );

        const { result, rerender } = renderHook(() => useServices(selectADep, selectBDep), {
            wrapper,
        });

        const firstSelectedServices = result.current;

        rerender();

        expect(result.current).toBe(firstSelectedServices);
    });
});
