import type { ReactNode } from 'react';

import type { PageOpts } from 'nextra';

import type { DocsThemeConfig } from './schema';

export type Context = {
    pageOpts: PageOpts;
    themeConfig: DocsThemeConfig;
};

export type SearchResult = {
    children: ReactNode;
    id: string;
    prefix?: ReactNode;
    route: string;
};
