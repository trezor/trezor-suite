import { ReactElement, ReactNode } from 'react';

import { renderHookWithBasicProvider } from '@suite-native/test-utils';

import { SectionHeaderRenderConfig, SectionListData, useSectionList } from '../useSectionList';

const renderUseSectionListHook = (
    data: SectionListData<any, any>,
    noSingletonSectionHeader: boolean = false,
    isLastItemRounded: boolean = true,
    renderSectionHeader?: (
        label: ReactNode,
        config: SectionHeaderRenderConfig<any>,
    ) => ReactElement,
) =>
    renderHookWithBasicProvider(() =>
        useSectionList({
            data,
            renderItem: jest.fn(),
            keyExtractor: jest.fn(),
            noSingletonSectionHeader,
            isLastItemRounded,
            renderSectionHeader,
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

    const section3 = {
        key: 'section3',
        label: 'Section 3',
        sectionData: { id: 's3' },
        data: ['item6'],
    };

    const mockData = [section1, section2, section3];

    describe('data transformation', () => {
        it('should correctly transform data with section headers', () => {
            const { result } = renderUseSectionListHook(mockData);

            const expectedTransformedData = [
                ['sectionHeader', 'Section 1', 'section1', { id: 's1' }],
                [
                    'item',
                    'item1',
                    { isFirst: true, isLast: false, sectionData: { id: 's1' }, isEnabled: true },
                ],
                [
                    'item',
                    'item2',
                    { isFirst: false, isLast: true, sectionData: { id: 's1' }, isEnabled: true },
                ],
                ['sectionHeader', 'Section 2', 'section2', { id: 's2' }],
                [
                    'item',
                    'item3',
                    { isFirst: true, isLast: false, sectionData: { id: 's2' }, isEnabled: true },
                ],
                [
                    'item',
                    'item4',
                    { isFirst: false, isLast: false, sectionData: { id: 's2' }, isEnabled: true },
                ],
                [
                    'item',
                    'item5',
                    { isFirst: false, isLast: true, sectionData: { id: 's2' }, isEnabled: true },
                ],
                ['sectionHeader', 'Section 3', 'section3', { id: 's3' }],
                [
                    'item',
                    'item6',
                    { isFirst: true, isLast: true, sectionData: { id: 's3' }, isEnabled: true },
                ],
            ];

            expect(result.current.data).toEqual(expectedTransformedData);
        });

        it('should handle single section with noSingletonSectionHeader=true', () => {
            const { result } = renderUseSectionListHook([section1], true);

            const expectedTransformedData = [
                [
                    'item',
                    'item1',
                    { isFirst: true, isLast: false, sectionData: { id: 's1' }, isEnabled: true },
                ],
                [
                    'item',
                    'item2',
                    { isFirst: false, isLast: true, sectionData: { id: 's1' }, isEnabled: true },
                ],
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

            expect(result.current.sectionsCount).toBe(3);
        });

        it('should correctly calculate itemsCount', () => {
            const { result } = renderUseSectionListHook(mockData);

            expect(result.current.itemsCount).toBe(6);
        });
    });

    describe('isEnabled property handling', () => {
        const sectionWithDisabledItems = {
            key: 'section3',
            label: 'Section 3',
            sectionData: { id: 's3' },
            data: [
                { id: 'item6', isEnabled: true },
                { id: 'item7', isEnabled: false },
                { id: 'item8' }, // undefined isEnabled should default to true
            ],
        };

        it('should correctly handle items with explicit or undefined isEnabled property', () => {
            const { result } = renderUseSectionListHook([sectionWithDisabledItems]);

            const transformedData = result.current.data;
            const items = transformedData.filter(item => item[0] === 'item');

            expect((items[0][2] as any).isEnabled).toBe(true); // item6
            expect((items[1][2] as any).isEnabled).toBe(false); // item7
            expect((items[2][2] as any).isEnabled).toBe(true); // item8 (default)
        });
    });
});
