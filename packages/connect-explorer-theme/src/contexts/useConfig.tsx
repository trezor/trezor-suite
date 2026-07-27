import { createContext, useContext } from 'react';

import type { FrontMatter, PageOpts } from 'nextra';

import type { DocsThemeConfig } from '../schema';
export type Config<FrontMatterType = FrontMatter> = DocsThemeConfig &
    Pick<PageOpts<FrontMatterType>, 'flexsearch' | 'title' | 'frontMatter'>;
export const ConfigContext = createContext<Config>({} as Config);
export function useConfig<FrontMatterType = FrontMatter>() {
    return useContext<Config<FrontMatterType>>(ConfigContext);
}
