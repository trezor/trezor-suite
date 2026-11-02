import type { ReactElement, ReactNode } from 'react';
import { useMemo } from 'react';

import type { NextraThemeLayoutProps } from 'nextra';
import 'focus-visible';
import { MDXProvider } from 'nextra/mdx';
import './polyfill';
import { createGlobalStyle } from 'styled-components';

import { Banner, Head, Navbar } from './components';
import { ActiveAnchorProvider } from './contexts/active-anchor';
import { ConfigProvider } from './contexts/config';
import { ThemeConfigProvider, useThemeConfig } from './contexts/theme-config';
import { useConfig } from './contexts/useConfig';
import { getComponents } from './mdx-components';
import { type DocsThemeConfig, type PartialDocsThemeConfig } from './schema';
import { DEEP_OBJECT_KEYS, DEFAULT_THEME } from './theme';
import { renderComponent } from './utils/render';

const GlobalStyle = createGlobalStyle`
    body, .bg-page {
        background: ${({ theme }) => theme.surfaceFillPage}
    }
`;

const InnerLayout = ({ children }: { children: ReactNode }): ReactElement => {
    const themeConfig = useThemeConfig();
    const config = useConfig();
    const {
        activeThemeContext: themeContext,
        activePath,
        topLevelNavbarItems,
    } = config.normalizePagesResult;

    const components = getComponents({
        frontMatter: config.frontMatter,
        isRawLayout: themeContext.layout === 'raw',
        components: themeConfig.components,
    });

    // Nextra derives the document title from the filename and title-cases it at build time
    // (e.g. `selectAccount` → `SelectAccount`), which is independent of the sidebar titles fixed
    // by `patchedNormalizePages`. Method names must stay in their original casing, so for method
    // pages reuse the already-corrected title from `activePath`.
    const documentTitle =
        activePath[0]?.route === '/methods' ? activePath[activePath.length - 1]?.title : undefined;

    return (
        <div>
            <Head title={documentTitle} />
            <Banner />
            {themeContext.navbar && <Navbar items={topLevelNavbarItems} />}
            <ActiveAnchorProvider>
                <MDXProvider disableParentContext components={components}>
                    {children}
                </MDXProvider>
            </ActiveAnchorProvider>
            {themeContext.footer &&
                renderComponent(themeConfig.footer.component, { menu: config.hideSidebar })}
        </div>
    );
};

// eslint-disable-next-line import/no-default-export
export default function Layout({
    children,
    themeConfig,
    pageOpts,
}: NextraThemeLayoutProps): ReactElement {
    const mergedThemeConfig: DocsThemeConfig = useMemo(
        () => ({
            ...DEFAULT_THEME,
            ...Object.fromEntries(
                Object.entries(themeConfig ?? {}).map(([key, value]) => [
                    key,
                    value && typeof value === 'object' && DEEP_OBJECT_KEYS.includes(key)
                        ? { ...DEFAULT_THEME[key], ...value }
                        : value,
                ]),
            ),
        }),
        [themeConfig],
    );

    return (
        <ThemeConfigProvider value={mergedThemeConfig}>
            <ConfigProvider value={pageOpts}>
                <GlobalStyle />
                <InnerLayout>{children}</InnerLayout>
            </ConfigProvider>
        </ThemeConfigProvider>
    );
}

export { useConfig, useThemeConfig, type PartialDocsThemeConfig as DocsThemeConfig };
export { type NetworkRoute, asNetworkRoute } from './networkRoute';
export {
    type NetworkRouteToSymbolMap,
    selectNetworkRouteToSymbolMap,
} from './selectors/networkRouteToSymbolMapSelectors';
export { useMDXComponents } from 'nextra/mdx';
export { Callout, Steps, Tabs, Cards, FileTree } from 'nextra/components';
export { useTheme } from 'next-themes';
export { Link } from './mdx-components';
export {
    Bleed,
    Collapse,
    NotFoundPage,
    ServerSideErrorPage,
    Navbar,
    SkipNavContent,
    SkipNavLink,
    ThemeSwitch,
    LocaleSwitch,
} from './components';
