import { act, renderHook } from '@testing-library/react';

import { useSectionDataFilter } from '../useSectionDataFilter';

type ItemShape = {
    id: string;
    name: string;
};

type SectionShape = {
    key: string;
    label: string;
    data: ItemShape[];
};

const rawSections: SectionShape[] = [
    {
        key: 'section_a',
        label: 'Section A',
        data: [
            { id: '1', name: 'Apple' },
            { id: '2', name: 'Avocado' },
        ],
    },
    {
        key: 'section_b',
        label: 'Section B',
        data: [
            { id: '3', name: 'Banana' },
            { id: '4', name: 'Blueberry' },
        ],
    },
];

const filterCallback = (item: ItemShape, filterValue: string) =>
    item.name.toLowerCase().includes(filterValue.toLowerCase());

describe('useSectionDataFilter', () => {
    const renderFilter = () => renderHook(() => useSectionDataFilter(rawSections, filterCallback));

    it('should return the original sections reference when no filter is applied', () => {
        const { result } = renderFilter();

        expect(result.current.filteredSections).toBe(rawSections);
    });

    it('should filter items within sections based on filter value', () => {
        const { result } = renderFilter();

        act(() => {
            result.current.setFilterValue('Apple');
        });

        expect(result.current.filteredSections).toHaveLength(1);
        expect(result.current.filteredSections[0]?.key).toBe('section_a');
        expect(result.current.filteredSections[0]?.data).toHaveLength(1);
        expect(result.current.filteredSections[0]?.data[0]?.name).toBe('Apple');
    });

    it('should keep items from multiple sections when both have matches', () => {
        const { result } = renderFilter();

        act(() => {
            result.current.setFilterValue('e');
        });

        expect(result.current.filteredSections).toHaveLength(2);
    });

    it('should preserve extra section properties after filtering', () => {
        const { result } = renderFilter();

        act(() => {
            result.current.setFilterValue('Apple');
        });

        expect(result.current.filteredSections[0]?.label).toBe('Section A');
    });

    it('should remove sections with no matching items', () => {
        const { result } = renderFilter();

        act(() => {
            result.current.setFilterValue('Banana');
        });

        expect(result.current.filteredSections).toHaveLength(1);
        expect(result.current.filteredSections[0]?.key).toBe('section_b');
    });

    it('should return empty array when no items match', () => {
        const { result } = renderFilter();

        act(() => {
            result.current.setFilterValue('NonExistent');
        });

        expect(result.current.filteredSections).toHaveLength(0);
    });

    it('should return empty string as filter value by default', () => {
        const { result } = renderFilter();

        expect(result.current.filterValue).toBe('');
    });

    it('should return the current filter value', () => {
        const { result } = renderFilter();

        act(() => {
            result.current.setFilterValue('Apple');
        });

        expect(result.current.filterValue).toBe('Apple');
    });

    describe('with sortSectionItemsCallback', () => {
        const sortSectionItemsCallback = (a: ItemShape, b: ItemShape) =>
            -a.name.localeCompare(b.name);

        const renderFilterWithSort = () =>
            renderHook(() =>
                useSectionDataFilter(rawSections, filterCallback, sortSectionItemsCallback),
            );

        it('should sort items within each section when filter is active', () => {
            const { result } = renderFilterWithSort();

            act(() => {
                result.current.setFilterValue('a');
            });

            expect(result.current.filteredSections[0]?.data.map(i => i.name)).toEqual([
                'Avocado',
                'Apple',
            ]);
        });

        it('should not sort when filter is not active', () => {
            const { result } = renderFilterWithSort();

            expect(result.current.filteredSections).toBe(rawSections);
        });
    });

    describe('with sortSectionsCallback', () => {
        const sortSectionsCallback = (a: SectionShape, b: SectionShape) =>
            -a.key.localeCompare(b.key);

        const renderFilterWithSectionSort = () =>
            renderHook(() =>
                useSectionDataFilter(rawSections, filterCallback, undefined, sortSectionsCallback),
            );

        it('should sort sections when filter is active', () => {
            const { result } = renderFilterWithSectionSort();

            act(() => {
                result.current.setFilterValue('a');
            });

            expect(result.current.filteredSections.map(s => s.key)).toEqual([
                'section_b',
                'section_a',
            ]);
        });

        it('should not sort sections when filter is not active', () => {
            const { result } = renderFilterWithSectionSort();

            expect(result.current.filteredSections).toBe(rawSections);
        });
    });
});
