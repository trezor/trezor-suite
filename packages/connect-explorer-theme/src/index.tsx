import type { ReactElement, ReactNode } from 'react';
import { useMemo } from 'react';

import type { NextraThemeLayoutProps } from 'nextra';
import 'focus-visible';
import { MDXProvider } from 'nextra/mdx';
import './polyfill';
import { createGlobalStyle } from 'styled-components';

import { ElevationContext } from '@trezor/components';
import { type Elevation, mapElevationToBackground } from '@trezor/theme';

import { Banner, Head, Navbar } from './components';
import { ActiveAnchorProvider } from './contexts/active-anchor';
import { ConfigProvider } from './contexts/config';
import { ThemeConfigProvider, useThemeConfig } from './contexts/theme-config';
import { useConfig } from './contexts/useConfig';
import { getComponents } from './mdx-components';
import { type PartialDocsThemeConfig } from './schema';
import { DEEP_OBJECT_KEYS, DEFAULT_THEME } from './theme';
import { renderComponent } from './utils/render';

const GlobalStyle = createGlobalStyle<{ $elevation: Elevation }>`
    body, .bg-page {
        background: ${mapElevationToBackground}
    }
`;

const InnerLayout = ({ children }: { children: ReactNode }): ReactElement => {
    const themeConfig = useThemeConfig();
    const config = useConfig();
    const { activeThemeContext: themeContext, topLevelNavbarItems } = config.normalizePagesResult;

    const components = getComponents({
        frontMatter: config.frontMatter,
        isRawLayout: themeContext.layout === 'raw',
        components: themeConfig.components,
    });

    return (
        <div>
            <Head />
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
    const baseElevation = 0;

    const mergedThemeConfig = useMemo(
        () => ({
            ...DEFAULT_THEME,
            ...(themeConfig &&
                Object.fromEntries(
                    Object.entries(themeConfig as object).map(([key, val]) => [
                        key,
                        val && typeof val === 'object' && DEEP_OBJECT_KEYS.includes(key)
                            ? { ...(DEFAULT_THEME as any)[key], ...(val as any) }
                            : val,
                    ]),
                )),
        }),
        // themeConfig is static per page load; useMemo avoids re-creating on every render
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    return (
        <ThemeConfigProvider value={mergedThemeConfig}>
            <ConfigProvider value={pageOpts}>
                <GlobalStyle $elevation={baseElevation} />
                <ElevationContext baseElevation={baseElevation}>
                    <InnerLayout>{children}</InnerLayout>
                </ElevationContext>
            </ConfigProvider>
        </ThemeConfigProvider>
    );
}

export { useConfig, useThemeConfig, type PartialDocsThemeConfig as DocsThemeConfig };
export { ThemeConfigProvider };
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
