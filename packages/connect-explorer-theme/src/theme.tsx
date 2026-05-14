/* eslint sort-keys: error */
import { isValidElement } from 'react';

import { useRouter } from 'next/router';
import { DiscordIcon, GitHubIcon } from 'nextra/icons';

import { Icon, type IconName } from '@trezor/components';

import { Anchor } from './components/anchor';
import { Flexsearch } from './components/flexsearch';
import { Footer } from './components/footer';
import { MatchSorterSearch } from './components/match-sorter-search';
import { Navbar } from './components/navbar';
import { ThemeSwitch } from './components/theme-switch';
import { TOC } from './components/toc';
import { DEFAULT_LOCALE } from './constants';
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
                <span className="nx-sr-only">Discord</span>
            </>
        ),
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
        text: 'Edit this page',
    },
    feedback: {
        content: 'Question? Give us feedback →',
        labels: 'feedback',
        useLink() {
            const config = useConfig();

            return getGitIssueUrl({
                labels: config.feedback.labels,
                repository: config.docsRepositoryBase,
                title: `Feedback for “${config.title}”`,
            });
        },
    },
    footer: {
        component: Footer,
        text: `MIT ${new Date().getFullYear()} © Nextra.`,
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
            {/* other meta tags get set by next-seo */}
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
    primaryHue: {
        dark: 204,
        light: 212,
    },
    primarySaturation: {
        dark: 100,
        light: 100,
    },
    project: {
        icon: (
            <>
                <GitHubIcon />
                <span className="nx-sr-only">GitHub</span>
            </>
        ),
    },
    search: {
        component: function Search({ className, directories }) {
            const config = useConfig();

            return config.flexsearch ? (
                <Flexsearch className={className} />
            ) : (
                <MatchSorterSearch className={className} directories={directories} />
            );
        },
        emptyResult: (
            <span className="nx-block nx-select-none nx-p-8 nx-text-center nx-text-sm nx-text-gray-400">
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
    serverSideError: {
        content: 'Submit an issue about error in url →',
        labels: 'bug',
    },
    sidebar: {
        defaultMenuCollapseLevel: 1,
        titleComponent: ({ title, icon }) => (
            <div
                style={{
                    alignItems: 'center',
                    display: 'flex',
                    gap: '0.5rem',
                }}
            >
                {icon && <Icon name={icon as IconName} size={16} />}
                {title}
            </div>
        ),
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
        backToTop: false,
        component: TOC,
        extraContent: null,
        float: true,
        title: 'On This Page',
    },
    useNextSeoProps: () => ({ titleTemplate: '%s – Nextra' }),
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
