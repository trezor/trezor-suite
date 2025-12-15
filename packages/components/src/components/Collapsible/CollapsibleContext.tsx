import { createContext, useContext } from 'react';

import type { SpacingValues } from '@trezor/theme';
import { spacings } from '@trezor/theme';

type CollapsibleContextProps = {
    isOpen: boolean;
    toggle: (isOpen: boolean) => void;
    gap?: SpacingValues;
    contentId: string;
};

export const CollapsibleContext = createContext<CollapsibleContextProps>({
    isOpen: false,
    toggle: () => {},
    gap: spacings.zero,
    contentId: '',
});

export const useCollapsible = () => useContext(CollapsibleContext);
