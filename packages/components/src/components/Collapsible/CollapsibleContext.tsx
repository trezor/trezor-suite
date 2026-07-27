import { createContext, useContext } from 'react';

import { type SpacingValue } from '@trezor/theme';

type CollapsibleContextProps = {
    isOpen: boolean;
    toggle: (isOpen: boolean) => void;
    gap?: SpacingValue;
    contentId: string;
};

export const CollapsibleContext = createContext<CollapsibleContextProps>({
    isOpen: false,
    toggle: () => {},
    gap: 0,
    contentId: '',
});

export const useCollapsible = () => useContext(CollapsibleContext);
