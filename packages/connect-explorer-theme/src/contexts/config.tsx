import type { ReactElement, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/router';
import type { PageOpts } from 'nextra';
import { useFSRoute } from 'nextra/hooks';

import { MenuProvider } from './menu';
import { type Config, ConfigContext } from './useConfig';
import { patchedNormalizePages } from '../utils/patch-normalize-pages';

export function ConfigProvider({
    children,
    value: pageOpts,
}: {
    children: ReactNode;
    value: PageOpts;
}): ReactElement {
    const [menu, setMenu] = useState(false);
    const { asPath } = useRouter();
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

    useEffect(() => {
        setMenu(false);
    }, [asPath]);

    useEffect(() => {
        document.body.classList.toggle('max-md:_overflow-hidden', menu);
    }, [menu]);

    const menuValue = useMemo(() => ({ menu, setMenu }), [menu]);

    return (
        <ConfigContext.Provider value={extendedConfig}>
            <MenuProvider value={menuValue}>{children}</MenuProvider>
        </ConfigContext.Provider>
    );
}
