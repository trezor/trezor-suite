import type { ReactElement, ReactNode } from 'react';
import { useMemo, useState } from 'react';

import type { PageOpts } from 'nextra';
import { useFSRoute } from 'nextra/hooks';

import { MenuProvider } from './menu';
import { type Config, ConfigContext } from './useConfig';
import { patchedNormalizePages } from '../utils/patch-normalize-pages';

type ConfigProviderProps = {
    children: ReactNode;
    value: PageOpts;
};

export const ConfigProvider = ({
    children,
    value: pageOpts,
}: ConfigProviderProps): ReactElement => {
    const [menu, setMenu] = useState(false);
    const fsPath = useFSRoute();

    const normalizePagesResult = useMemo(
        () => patchedNormalizePages({ list: pageOpts.pageMap, route: fsPath }),
        [pageOpts.pageMap, fsPath],
    );

    const { activeType, activeThemeContext: themeContext } = normalizePagesResult;

    const extendedConfig: Config = {
        title: pageOpts.title,
        frontMatter: pageOpts.frontMatter,
        filePath: pageOpts.filePath,
        timestamp: pageOpts.timestamp,
        hideSidebar:
            !themeContext.sidebar || themeContext.layout === 'raw' || activeType === 'page',
        normalizePagesResult,
    };

    return (
        <ConfigContext.Provider value={extendedConfig}>
            <MenuProvider value={{ menu, setMenu }}>{children}</MenuProvider>
        </ConfigContext.Provider>
    );
};
