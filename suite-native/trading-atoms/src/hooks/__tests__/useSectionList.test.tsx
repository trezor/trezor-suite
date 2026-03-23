import { Text } from 'react-native';

import { renderHookWithBasicProvider } from '@suite-native/test-utils';

import { type UseSectionListProps, useSectionList } from '../useSectionList';

const renderUseSectionListHook = <T, U = undefined>(
    initialProps: Partial<UseSectionListProps<T, U>>,
) =>
    renderHookWithBasicProvider(
        ({
            data = [],
            noSingletonSectionHeader = false,
            isLastItemRounded = true,
            renderSectionHeader,
            SectionEmptyComponent,
        }: Partial<UseSectionListProps<T, U>>) =>
            useSectionList({
                data,
                renderItem: jest.fn(),
                keyExtractor: jest.fn(),
                noSingletonSectionHeader,
                isLastItemRounded,
                renderSectionHeader,
                SectionEmptyComponent,
            }),
        {
            initialProps,
        },
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

    const section4 = {
        key: 'section4',
        label: 'Section 4',
        sectionData: { id: 's4' },
        data: [],
    };

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

    const mockData = [section1, section2, section3];

    describe('data transformation', () => {
        it('should correctly transform data with section headers', () => {
            const { result } = renderUseSectionListHook({
                data: mockData,
            });

            const expectedTransformedData = [
                {
                    type: 'sectionHeader',
                    title: 'Section 1',
                    key: 'section1',
                    sectionData: { id: 's1' },
                },
                {
                    type: 'item',
                    item: 'item1',
                    config: {
                        isFirst: true,
                        isLast: false,
                        sectionData: { id: 's1' },
                        isEnabled: true,
                    },
                },
                {
                    type: 'item',
                    item: 'item2',
                    config: {
                        isFirst: false,
                        isLast: true,
                        sectionData: { id: 's1' },
                        isEnabled: true,
                    },
                },
                {
                    type: 'sectionHeader',
                    title: 'Section 2',
                    key: 'section2',
                    sectionData: { id: 's2' },
                },
                {
                    type: 'item',
                    item: 'item3',
                    config: {
                        isFirst: true,
                        isLast: false,
                        sectionData: { id: 's2' },
                        isEnabled: true,
                    },
                },
                {
                    type: 'item',
                    item: 'item4',
                    config: {
                        isFirst: false,
                        isLast: false,
                        sectionData: { id: 's2' },
                        isEnabled: true,
                    },
                },
                {
                    type: 'item',
                    item: 'item5',
                    config: {
                        isFirst: false,
                        isLast: true,
                        sectionData: { id: 's2' },
                        isEnabled: true,
                    },
                },
                {
                    type: 'sectionHeader',
                    title: 'Section 3',
                    key: 'section3',
                    sectionData: { id: 's3' },
                },
                {
                    type: 'item',
                    item: 'item6',
                    config: {
                        isFirst: true,
                        isLast: true,
                        sectionData: { id: 's3' },
                        isEnabled: true,
                    },
                },
            ];

            expect(result.current.data).toEqual(expectedTransformedData);
        });

        describe('with noSingletonSectionHeader', () => {
            it('should handle single section', () => {
                const { result } = renderUseSectionListHook({
                    data: [section1],
                    noSingletonSectionHeader: true,
                });

                const expectedTransformedData = [
                    {
                        type: 'item',
                        item: 'item1',
                        config: {
                            isFirst: true,
                            isLast: false,
                            sectionData: { id: 's1' },
                            isEnabled: true,
                        },
                    },
                    {
                        type: 'item',
                        item: 'item2',
                        config: {
                            isFirst: false,
                            isLast: true,
                            sectionData: { id: 's1' },
                            isEnabled: true,
                        },
                    },
                ];

                expect(result.current.data).toEqual(expectedTransformedData);
            });

            it('should handle empty data', () => {
                const { result } = renderUseSectionListHook({
                    data: [],
                    noSingletonSectionHeader: true,
                });

                expect(result.current.data).toEqual([]);
            });

            it('should handle empty sections', () => {
                const { result } = renderUseSectionListHook({
                    data: [section4],
                    noSingletonSectionHeader: true,
                });

                expect(result.current.data).toEqual([]);
            });

            it('should handle empty section even with renderEmptySectionContent specified', () => {
                const { result } = renderUseSectionListHook({
                    data: [section4],
                    noSingletonSectionHeader: true,
                    SectionEmptyComponent: <Text>Empty Section Placeholder</Text>,
                });

                expect(result.current.data).toEqual([]);
            });

            it('should handle multiple sections with SectionEmptyComponent specified', () => {
                const { result } = renderUseSectionListHook({
                    data: [section3, section4],
                    SectionEmptyComponent: <Text>Empty Section Placeholder</Text>,
                    noSingletonSectionHeader: true,
                });

                expect(result.current.data).toEqual([
                    {
                        type: 'sectionHeader',
                        title: 'Section 3',
                        key: 'section3',
                        sectionData: { id: 's3' },
                    },
                    {
                        type: 'item',
                        item: 'item6',
                        config: {
                            isFirst: true,
                            isLast: true,
                            sectionData: { id: 's3' },
                            isEnabled: true,
                        },
                    },
                    {
                        type: 'sectionHeader',
                        title: 'Section 4',
                        key: 'section4',
                        sectionData: { id: 's4' },
                    },
                    {
                        type: 'emptySection',
                        key: 'section4-empty-section',
                        config: expect.objectContaining({ sectionData: { id: 's4' } }),
                    },
                ]);
            });
        });

        describe('without noSingletonSectionHeader', () => {
            it('should handle single section', () => {
                const { result } = renderUseSectionListHook({
                    data: [section1],
                });

                const expectedTransformedData = [
                    {
                        type: 'sectionHeader',
                        title: 'Section 1',
                        key: 'section1',
                        sectionData: { id: 's1' },
                    },
                    {
                        type: 'item',
                        item: 'item1',
                        config: {
                            isFirst: true,
                            isLast: false,
                            sectionData: { id: 's1' },
                            isEnabled: true,
                        },
                    },
                    {
                        type: 'item',
                        item: 'item2',
                        config: {
                            isFirst: false,
                            isLast: true,
                            sectionData: { id: 's1' },
                            isEnabled: true,
                        },
                    },
                ];

                expect(result.current.data).toEqual(expectedTransformedData);
            });

            it('should handle empty data', () => {
                const { result } = renderUseSectionListHook({
                    data: [],
                });

                expect(result.current.data).toEqual([]);
            });

            it('should handle empty sections', () => {
                const { result } = renderUseSectionListHook({
                    data: [section4],
                });

                expect(result.current.data).toEqual([
                    {
                        type: 'sectionHeader',
                        title: 'Section 4',
                        key: 'section4',
                        sectionData: { id: 's4' },
                    },
                ]);
            });

            it('should handle empty section even with SectionEmptyComponent specified', () => {
                const { result } = renderUseSectionListHook({
                    data: [section4],
                    SectionEmptyComponent: <Text>Empty Section Placeholder</Text>,
                });

                expect(result.current.data).toEqual([
                    {
                        type: 'sectionHeader',
                        title: 'Section 4',
                        key: 'section4',
                        sectionData: { id: 's4' },
                    },
                    {
                        type: 'emptySection',
                        key: 'section4-empty-section',
                        config: {
                            sectionData: { id: 's4' },
                            isFirst: true,
                            isLast: true,
                            isEnabled: false,
                        },
                    },
                ]);
            });

            it('should handle multiple sections with SectionEmptyComponent specified', () => {
                const { result } = renderUseSectionListHook({
                    data: [section3, section4],
                    SectionEmptyComponent: <Text>Empty Section Placeholder</Text>,
                });

                expect(result.current.data).toEqual([
                    {
                        type: 'sectionHeader',
                        title: 'Section 3',
                        key: 'section3',
                        sectionData: { id: 's3' },
                    },
                    {
                        type: 'item',
                        item: 'item6',
                        config: {
                            isFirst: true,
                            isLast: true,
                            sectionData: { id: 's3' },
                            isEnabled: true,
                        },
                    },
                    {
                        type: 'sectionHeader',
                        title: 'Section 4',
                        key: 'section4',
                        sectionData: { id: 's4' },
                    },
                    {
                        type: 'emptySection',
                        key: 'section4-empty-section',
                        config: expect.objectContaining({ sectionData: { id: 's4' } }),
                    },
                ]);
            });
        });
    });

    describe('sections and items count', () => {
        it('should correctly calculate sectionsCount', () => {
            const { result } = renderUseSectionListHook({ data: mockData });

            expect(result.current.sectionsCount).toBe(3);
        });

        it('should correctly calculate itemsCount', () => {
            const { result } = renderUseSectionListHook({ data: mockData });

            expect(result.current.itemsCount).toBe(6);
        });
    });

    describe('isEnabled property handling', () => {
        it('should correctly handle items with explicit or undefined isEnabled property', () => {
            const { result } = renderUseSectionListHook({ data: [sectionWithDisabledItems] });

            const transformedData = result.current.data;
            const items = transformedData.filter(item => item.type === 'item');

            expect((items[0] as any).config.isEnabled).toBe(true); // item6
            expect((items[1] as any).config.isEnabled).toBe(false); // item7
            expect((items[2] as any).config.isEnabled).toBe(true); // item8 (default)
        });
    });
});
