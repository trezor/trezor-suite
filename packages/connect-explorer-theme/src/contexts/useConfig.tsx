import { createContext, useContext } from 'react';

import type { FrontMatter, PageOpts } from 'nextra';
import { type normalizePages } from 'nextra/normalize-pages';

export type Config<FrontMatterType = FrontMatter> = Pick<
    PageOpts<FrontMatterType>,
    'title' | 'frontMatter' | 'filePath' | 'timestamp'
> & {
    hideSidebar: boolean;
    normalizePagesResult: ReturnType<typeof normalizePages>;
};

export const ConfigContext = createContext<Config>({
    title: '',
    frontMatter: {},
    filePath: '',
    hideSidebar: false,
    normalizePagesResult: {} as ReturnType<typeof normalizePages>,
});

export function useConfig<FrontMatterType = FrontMatter>() {
    return useContext(ConfigContext) as Config<FrontMatterType>;
}
