import { renderHookWithBasicProvider } from '@suite-native/test-utils';

import { SectionListData, useSectionList } from '../useSectionList';

const renderUseSectionListHook = (
    data: SectionListData<any, any>,
    noSingletonSectionHeader: boolean = false,
) =>
    renderHookWithBasicProvider(() =>
        useSectionList({
            data,
            renderItem: jest.fn(),
            keyExtractor: jest.fn(),
            noSingletonSectionHeader,
        }),
    );

describe('useSectionList', () => {
    const section1 = {
        key: 'section1',
        label: 'Section 1',
        sectionData: { id: 's1' },
        data: ['item1', 'item2'],
    };

    const section2 = {
        key: 'section2',
        label: 'Section 2',
        sectionData: { id: 's2' },
        data: ['item3', 'item4', 'item5'],
    };

    const mockData = [section1, section2];

    describe('data transformation', () => {
        it('should correctly transform data with section headers', () => {
            const { result } = renderUseSectionListHook(mockData);

            const expectedTransformedData = [
                ['sectionHeader', 'Section 1', 'section1'],
                ['item', 'item1', { isFirst: true, isLast: false, sectionData: { id: 's1' } }],
                ['item', 'item2', { isFirst: false, isLast: true, sectionData: { id: 's1' } }],
                ['sectionHeader', 'Section 2', 'section2'],
                ['item', 'item3', { isFirst: true, isLast: false, sectionData: { id: 's2' } }],
                ['item', 'item4', { isFirst: false, isLast: false, sectionData: { id: 's2' } }],
                ['item', 'item5', { isFirst: false, isLast: true, sectionData: { id: 's2' } }],
            ];

            expect(result.current.data).toEqual(expectedTransformedData);
        });

        it('should handle single section with noSingletonSectionHeader=true', () => {
            const { result } = renderUseSectionListHook([section1], true);

            const expectedTransformedData = [
                ['item', 'item1', { isFirst: true, isLast: false, sectionData: { id: 's1' } }],
                ['item', 'item2', { isFirst: false, isLast: true, sectionData: { id: 's1' } }],
            ];

            expect(result.current.data).toEqual(expectedTransformedData);
        });

        it('should handle empty data', () => {
            const { result } = renderUseSectionListHook([], true);

            expect(result.current.data).toEqual([]);
        });
        it('should handle empty sections', () => {
            const { result } = renderUseSectionListHook([{ ...section1, data: [] }], true);

            expect(result.current.data).toEqual([]);
        });
    });

    describe('sections and items count', () => {
        it('should correctly calculate sectionsCount', () => {
            const { result } = renderUseSectionListHook(mockData);

            expect(result.current.sectionsCount).toBe(2);
        });

        it('should correctly calculate itemsCount', () => {
            const { result } = renderUseSectionListHook(mockData);

            expect(result.current.itemsCount).toBe(5);
        });
    });
});
