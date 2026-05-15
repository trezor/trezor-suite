import { useMemo, useState } from 'react';

export const useSectionDataFilter = <T, S extends { data: T[] }>(
    rawSections: S[],
    filterCallback: (item: T, filterValue: string) => boolean,
    sortSectionItemsCallback?: (a: T, b: T, filterValue: string) => number,
    sortSectionsCallback?: (a: S, b: S, filterValue: string) => number,
): {
    filteredSections: S[];
    filterValue: string;
    setFilterValue: (value: string) => void;
} => {
    const [filterValue, setFilterValue] = useState('');

    const filteredSections = useMemo(() => {
        if (!filterValue) {
            return rawSections;
        }

        const sections = rawSections
            .map(section => {
                const data = section.data.filter(item => filterCallback(item, filterValue));

                if (sortSectionItemsCallback) {
                    data.sort((a, b) => sortSectionItemsCallback(a, b, filterValue));
                }

                return { ...section, data };
            })
            .filter(section => section.data.length > 0) as S[];

        if (sortSectionsCallback) {
            sections.sort((a, b) => sortSectionsCallback(a, b, filterValue));
        }

        return sections;
    }, [rawSections, filterValue, filterCallback, sortSectionItemsCallback, sortSectionsCallback]);

    return { filteredSections, filterValue, setFilterValue };
};
