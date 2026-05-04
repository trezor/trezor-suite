/* eslint sort-keys: error */
import { isValidElement } from 'react';

import { useRouter } from 'next/router';
import { DiscordIcon, GitHubIcon } from 'nextra/icons';

import { Anchor } from './components/anchor';
import { Flexsearch } from './components/flexsearch';
import { Footer } from './components/footer';
import { Navbar } from './components/navbar';
import { ThemeSwitch } from './components/theme-switch';
import { TOC } from './components/toc';
import { DEFAULT_LOCALE } from './constants';
import { useThemeConfig } from './contexts/theme-config-context';
import { useConfig } from './contexts/useConfig';
import type { DocsThemeConfig } from './schema';
import { getGitIssueUrl } from './utils/get-git-issue-url';
import { useGitEditUrl } from './utils/use-git-edit-url';

const LOADING_LOCALES: Record<string, string> = {
    'en-US': 'Loading',
    fr: 'Сhargement',
    ru: 'Загрузка',
    'zh-CN': '正在加载',
};

const PLACEHOLDER_LOCALES: Record<string, string> = {
    'en-US': 'Search documentation',
    fr: 'Rechercher documents',
    ru: 'Поиск документации',
    'zh-CN': '搜索文档',
};

export const DEFAULT_THEME: DocsThemeConfig = {
    banner: {
        dismissible: true,
        key: 'nextra-banner',
    },
    chat: {
        icon: (
            <>
                <DiscordIcon />
                <span className="_sr-only">Discord</span>
            </>
        ),
    },
    color: {
        hue: {
            dark: 204,
            light: 212,
        },
        saturation: 100,
    },
    darkMode: true,
    direction: 'ltr',
    docsRepositoryBase: 'https://github.com/trezor/trezor-suite',
    editLink: {
        component: function EditLink({ className, filePath, children }) {
            const editUrl = useGitEditUrl(filePath);
            if (!editUrl) {
                return null;
            }

            return (
                <Anchor className={className} href={editUrl}>
                    {children}
                </Anchor>
            );
        },
        content: 'Edit this page',
    },
    feedback: {
        content: 'Question? Give us feedback →',
        labels: 'feedback',
        useLink() {
            const config = useConfig();
            const themeConfig = useThemeConfig();

            return getGitIssueUrl({
                labels: themeConfig.feedback.labels,
                repository: themeConfig.docsRepositoryBase,
                title: `Feedback for "${config.title}"`,
            });
        },
    },
    footer: {
        component: Footer,
        content: `MIT ${new Date().getFullYear()} © Nextra.`,
    },
    gitTimestamp: function GitTimestamp({ timestamp }) {
        const { locale = DEFAULT_LOCALE } = useRouter();

        return (
            <>
                Last updated on{' '}
                <time dateTime={timestamp.toISOString()}>
                    {timestamp.toLocaleDateString(locale, {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                    })}
                </time>
            </>
        );
    },
    head: (
        <>
            <meta httpEquiv="Content-Language" content="en" />
        </>
    ),
    i18n: [],
    logo: <></>,
    logoLink: true,
    navbar: {
        component: Navbar,
    },
    navigation: true,
    nextThemes: {
        defaultTheme: 'system',
        storageKey: 'theme',
    },
    notFound: {
        content: 'Submit an issue about broken link →',
        labels: 'bug',
    },
    project: {
        icon: (
            <>
                <GitHubIcon />
                <span className="_sr-only">GitHub</span>
            </>
        ),
    },
    search: {
        component: function Search({ className }) {
            return <Flexsearch className={className} />;
        },
        emptyResult: (
            <span className="_block _select-none _p-8 _text-center _text-sm _text-gray-400">
                No results found.
            </span>
        ),
        error: 'Failed to load search index.',
        loading: function useLoading() {
            const { locale, defaultLocale = DEFAULT_LOCALE } = useRouter();
            const text = (locale && LOADING_LOCALES[locale]) || LOADING_LOCALES[defaultLocale];

            return <>{text}…</>;
        },
        placeholder: function usePlaceholder() {
            const { locale, defaultLocale = DEFAULT_LOCALE } = useRouter();
            const text =
                (locale && PLACEHOLDER_LOCALES[locale]) || PLACEHOLDER_LOCALES[defaultLocale];

            return `${text}…`;
        },
    },
    seo: {},
    sidebar: {
        defaultMenuCollapseLevel: 1,
        toggleButton: false,
    },
    themeSwitch: {
        component: ThemeSwitch,
        useOptions() {
            const { locale } = useRouter();

            if (locale === 'zh-CN') {
                return { dark: '深色主题', light: '浅色主题', system: '系统默认' };
            }

            return { dark: 'Dark', light: 'Light', system: 'System' };
        },
    },
    toc: {
        backToTop: null,
        component: TOC,
        extraContent: null,
        float: true,
        title: 'On This Page',
    },
};

export const DEEP_OBJECT_KEYS = Object.entries(DEFAULT_THEME)
    .map(([key, value]) => {
        const isObject =
            value && typeof value === 'object' && !Array.isArray(value) && !isValidElement(value);
        if (isObject) {
            return key;
        }
    })
    .filter(Boolean);
