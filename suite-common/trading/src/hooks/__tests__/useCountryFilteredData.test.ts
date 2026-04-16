import { act, renderHook } from '@testing-library/react';

import { useCountryFilteredData } from '../useCountryFilteredData';

describe('useCountryFilteredData', () => {
    const renderUseCountryFilteredData = () => renderHook(() => useCountryFilteredData());

    it('should return country data', () => {
        const { result } = renderUseCountryFilteredData();

        expect(result.current.filteredData).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    value: 'CZ',
                }),
            ]),
        );
    });

    it('should not contain sanctioned countries', () => {
        const { result } = renderUseCountryFilteredData();

        expect(result.current.filteredData).toEqual(
            expect.not.arrayContaining([
                expect.objectContaining({ value: 'KP' }), // North Korea
            ]),
        );
    });

    it('should filter by label case-insensitive', () => {
        const { result } = renderUseCountryFilteredData();

        act(() => {
            result.current.setFilterValue('CZEch');
        });

        expect(result.current.filteredData).toEqual([
            expect.objectContaining({ value: 'CZ', name: 'Czechia' }),
        ]);
    });

    it('should filter by value case-insensitive', () => {
        const { result } = renderUseCountryFilteredData();

        act(() => {
            result.current.setFilterValue('uS');
        });

        expect(result.current.filteredData).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ value: 'US', name: 'United States of America' }),
            ]),
        );
    });

    it('should filter by codeAlpha3 case-insensitive', () => {
        const { result } = renderUseCountryFilteredData();

        act(() => {
            result.current.setFilterValue('uSa');
        });

        expect(result.current.filteredData).toEqual([
            expect.objectContaining({ codeAlpha3: 'USA', name: 'United States of America' }),
        ]);
    });

    it('should filter by label ignoring diacritics', () => {
        const { result } = renderUseCountryFilteredData();

        act(() => {
            result.current.setFilterValue('aland');
        });

        expect(result.current.filteredData).toEqual(
            expect.arrayContaining([expect.objectContaining({ name: 'Åland Islands' })]),
        );
    });

    describe('sorting', () => {
        it('should sort by name when no filter is applied', () => {
            const { result } = renderUseCountryFilteredData();
            expect(result.current.filteredData[0]?.name).toBe('Åland Islands');
        });

        it('should place exact match on name before other results', () => {
            const { result } = renderUseCountryFilteredData();

            act(() => {
                result.current.setFilterValue('guinea');
            });

            expect(result.current.filteredData[0]).toEqual(
                expect.objectContaining({ name: 'Guinea' }),
            );
        });

        it('should place exact match on 2 digit code before other results', () => {
            const { result } = renderUseCountryFilteredData();

            act(() => {
                result.current.setFilterValue('uS');
            });

            expect(result.current.filteredData[0]).toEqual(
                expect.objectContaining({ value: 'US', name: 'United States of America' }),
            );
            expect(result.current.filteredData[1]).toEqual(
                expect.objectContaining({ name: 'Australia' }),
            );
        });

        it('should place exact match on 3 digit code before other results', () => {
            const { result } = renderUseCountryFilteredData();

            act(() => {
                result.current.setFilterValue('pol');
            });

            expect(result.current.filteredData).toEqual([
                expect.objectContaining({ name: 'Poland', codeAlpha3: 'POL' }),
                expect.objectContaining({ name: 'French Polynesia' }),
            ]);
        });

        it('should put matches on beginning before other matches - filter "sa"', () => {
            const { result } = renderUseCountryFilteredData();

            act(() => {
                result.current.setFilterValue('sa');
            });

            expect(result.current.filteredData[0]).toEqual(
                expect.objectContaining({ name: 'Saudi Arabia', value: 'SA' }), // exact match on value
            );
            expect(result.current.filteredData[1]).toEqual(
                expect.objectContaining({ name: 'Saint Barthélemy' }), // starts with match on name
            );
            expect(result.current.filteredData[11]).toEqual(
                expect.objectContaining({ name: 'American Samoa' }), // other match (that starts with a)
            );
        });

        it('should put matches on beginning before other matches - filter "Guinea"', () => {
            const { result } = renderUseCountryFilteredData();

            act(() => {
                result.current.setFilterValue('Guinea');
            });

            expect(result.current.filteredData).toEqual([
                expect.objectContaining({ name: 'Guinea' }), // exact match on name
                expect.objectContaining({ name: 'Guinea-Bissau' }), // starts with match on name
                expect.objectContaining({ name: 'Equatorial Guinea' }), // other match
                expect.objectContaining({ name: 'Papua New Guinea' }), // other match
            ]);
        });
    });
});
