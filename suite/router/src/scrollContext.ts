import { type RefObject, createContext } from 'react';

type ScrollContextPayload = {
    scrollRef: RefObject<HTMLDivElement | null>;
    topOffset: number;
};

export const ScrollContext = createContext<ScrollContextPayload>({
    scrollRef: { current: null },
    topOffset: 0,
});
