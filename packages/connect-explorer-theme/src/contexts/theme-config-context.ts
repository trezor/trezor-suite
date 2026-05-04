import { createContext, useContext } from 'react';

import type { DocsThemeConfig } from '../schema';

export const ThemeConfigContext = createContext<DocsThemeConfig>(null!);
ThemeConfigContext.displayName = 'ThemeConfig';

export const useThemeConfig = () => useContext(ThemeConfigContext);
