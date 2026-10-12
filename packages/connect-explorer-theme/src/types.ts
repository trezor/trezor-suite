import type { ReactNode } from 'react';

import type { Heading } from 'nextra';

// Intentionally keep this file free of imports from './schema' to avoid cycles.

export type SearchResult = {
    children: ReactNode;
    id: string;
    prefix?: ReactNode;
    route: string;
};

export type TOCProps = {
    toc: Heading[];
    filePath: string;
};
