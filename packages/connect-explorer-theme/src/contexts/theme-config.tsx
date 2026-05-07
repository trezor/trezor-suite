import type { ReactElement, ReactNode } from 'react';
import { useRef } from 'react';

import type { DocsThemeConfig } from '../schema';
import { ThemeConfigContext } from './theme-config-context';

export { useThemeConfig } from './theme-config-context';

export function ThemeConfigProvider({
    value,
    children,
}: {
    value: DocsThemeConfig;
    children: ReactNode;
}): ReactElement {
    const storeRef = useRef<DocsThemeConfig | undefined>(undefined);
    storeRef.current ||= value;

    return (
        <ThemeConfigContext.Provider value={storeRef.current!}>
            {children}
        </ThemeConfigContext.Provider>
    );
}
