import { act, renderHook } from '@testing-library/react';

import { useListDataFilter } from '../useListDataFilter';

type ItemShape = {
    id: string;
    name: string;
};

describe('useListDataFilter', () => {
    const rawListData = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
        { id: '3', name: 'Item 3' },
    ];

    const filterCallback = (item: ItemShape, filterValue: string) =>
        item.name.includes(filterValue);

    const sortCallback = (a: ItemShape, b: ItemShape) => -a.name.localeCompare(b.name);

    const renderUseListDataFilter = () =>
        renderHook(() => useListDataFilter(rawListData, filterCallback));

    const renderUseListDataFilterWithSort = () =>
        renderHook(() => useListDataFilter(rawListData, filterCallback, sortCallback));

    it('should return all items by default', () => {
        const { result } = renderUseListDataFilter();

        expect(result.current.filteredData).toEqual(rawListData);
    });

    it('should filter items based on filter value', () => {
        const { result } = renderUseListDataFilter();

        act(() => {
            result.current.setFilterValue('Item 1');
        });

        expect(result.current.filteredData).toEqual([rawListData[0]]);
    });

    it('should return empty string as filter value by default', () => {
        const { result } = renderUseListDataFilter();

        expect(result.current.filterValue).toEqual('');
    });

    it('should return current filter value as string', () => {
        const { result } = renderUseListDataFilter();

        act(() => {
            result.current.setFilterValue('Item 1');
        });

        expect(result.current.filterValue).toEqual('Item 1');
    });

    describe('with sort callback', () => {
        it('should sort filtered items', () => {
            const { result } = renderUseListDataFilterWithSort();

            act(() => {
                result.current.setFilterValue('Item');
            });

            expect(result.current.filteredData).toEqual([
                { id: '3', name: 'Item 3' },
                { id: '2', name: 'Item 2' },
                { id: '1', name: 'Item 1' },
            ]);
        });
    });
});
