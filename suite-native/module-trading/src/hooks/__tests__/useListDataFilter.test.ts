import { act, renderHook } from '@suite-native/test-utils';

import { useListDataFilter } from '../useListDataFilter';

describe('useListDataFilter', () => {
    const rawListData = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
        { id: '3', name: 'Item 3' },
    ];

    const filterCallback = (item: (typeof rawListData)[number], filterValue: string) =>
        item.name.includes(filterValue);

    const renderUseListDataFilter = () =>
        renderHook(() => useListDataFilter(rawListData, filterCallback));

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
});
