import { createContext } from 'react';

export const FocusedItemContext = createContext<null | string>(null);
export const OnFocusItemContext = createContext<null | ((item: string | null) => any)>(null);
