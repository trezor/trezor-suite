import type { ReactElement } from 'react';

import type { ContextMenuProps } from './ContextMenu.types';

// Implemented in `ContextMenu.ios.tsx` and `ContextMenu.android.tsx`; Metro picks one by platform.
export declare const ContextMenu: (props: ContextMenuProps) => ReactElement;
