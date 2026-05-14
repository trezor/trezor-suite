import { act, renderHook } from '@testing-library/react';

import { useCountrySubdivisionFilteredData } from '../useCountrySubdivisionFilteredData';

describe('useCountrySubdivisionFilteredData', () => {
    it('should return empty data when countryCode is undefined', () => {
        const { result } = renderHook(() => useCountrySubdivisionFilteredData(undefined));

        expect(result.current.filteredData).toEqual([]);
    });

    it('should return empty data when country has no subdivisions', () => {
        const { result } = renderHook(() => useCountrySubdivisionFilteredData('CZ'));

        expect(result.current.filteredData).toEqual([]);
    });

    it('should return subdivision options for US', () => {
        const { result } = renderHook(() => useCountrySubdivisionFilteredData('US'));

        expect(result.current.filteredData.length).toBeGreaterThan(0);
        expect(result.current.filteredData).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ value: 'CA', label: 'California', name: 'California' }),
            ]),
        );
    });

    it('should filter by name case-insensitive', () => {
        const { result } = renderHook(() => useCountrySubdivisionFilteredData('US'));

        act(() => {
            result.current.setFilterValue('calif');
        });

        expect(result.current.filteredData).toEqual([
            expect.objectContaining({ value: 'CA', name: 'California' }),
        ]);
    });

    it('should filter by value (code)', () => {
        const { result } = renderHook(() => useCountrySubdivisionFilteredData('US'));

        act(() => {
            result.current.setFilterValue('NY');
        });

        expect(result.current.filteredData).toEqual([
            expect.objectContaining({ value: 'NY', name: 'New York' }),
        ]);
    });
});
