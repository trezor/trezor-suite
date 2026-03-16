import { type RefObject, useEffect } from 'react';

export function useListScrollReset<T extends HTMLElement>(
    listRef: RefObject<T | null>,
    listItemsFingerprint: string,
) {
    useEffect(() => {
        listRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    }, [listRef, listItemsFingerprint]);
}
