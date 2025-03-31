import { act, renderHook } from '@suite-native/test-utils';

import { useCountryFilteredData } from '../useCountryFilteredData';

describe('useCountryFilteredData', () => {
    const renderUseCountryFilteredData = () => renderHook(() => useCountryFilteredData());

    it('should return country data', () => {
        const { result } = renderUseCountryFilteredData();

        expect(result.current.filteredData).toEqual(
            expect.arrayContaining([
                {
                    label: '🇨🇿 Czech Republic',
                    value: 'CZ',
                },
            ]),
        );
    });

    it('should filter by label case-insensitive', () => {
        const { result } = renderUseCountryFilteredData();

        act(() => {
            result.current.setFilterValue('CZEch');
        });

        expect(result.current.filteredData).toEqual([expect.objectContaining({ value: 'CZ' })]);
    });

    it('should filter by value case-insensitive', () => {
        const { result } = renderUseCountryFilteredData();

        act(() => {
            result.current.setFilterValue('uS');
        });

        expect(result.current.filteredData).toEqual(
            expect.arrayContaining([expect.objectContaining({ value: 'US' })]),
        );
    });
});
