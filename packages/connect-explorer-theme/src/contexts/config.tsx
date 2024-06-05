import type { ReactElement, ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';

import type { FrontMatter, PageMapItem, PageOpts } from 'nextra';
import { metaSchema } from 'nextra/normalize-pages';
import type { ZodError } from 'zod';

import type { DocsThemeConfig } from '../constants';
import { DEEP_OBJECT_KEYS, DEFAULT_THEME, themeSchema } from '../constants';
import type { Context } from '../types';
import { MenuProvider } from './menu';

type Config<FrontMatterType = FrontMatter> = DocsThemeConfig &
    Pick<PageOpts<FrontMatterType>, 'flexsearch' | 'newNextLinkBehavior' | 'title' | 'frontMatter'>;

const ConfigContext = createContext<Config>({} as Config);

export function useConfig<FrontMatterType = FrontMatter>() {
    return useContext<Config<FrontMatterType>>(ConfigContext);
}

let theme: DocsThemeConfig;
let isValidated = false;

function normalizeZodMessage(error: unknown): string {
    return (error as ZodError).issues
        .flatMap(issue => {
            const themePath = issue.path.length > 0 && `Path: "${issue.path.join('.')}"`;
            const unionErrors =
                'unionErrors' in issue ? issue.unionErrors.map(normalizeZodMessage) : [];

            return [[issue.message, themePath].filter(Boolean).join('. '), ...unionErrors];
        })
        .join('\n');
}

function validateMeta(pageMap: PageMapItem[]) {
    for (const pageMapItem of pageMap) {
        if (pageMapItem.kind === 'Meta') {
            for (const [key, data] of Object.entries(pageMapItem.data)) {
                try {
                    metaSchema.parse(data);
                } catch (error) {
                    console.error(
                        `[nextra-theme-docs] Error validating _meta.json file for "${key}" property.\n\n${normalizeZodMessage(
                            error,
                        )}`,
                    );
                }
            }
        } else if (pageMapItem.kind === 'Folder') {
            validateMeta(pageMapItem.children);
        }
    }
}

export const ConfigProvider = ({
    children,
    value: { themeConfig, pageOpts },
}: {
    children: ReactNode;
    value: Context;
}): ReactElement => {
    const [menu, setMenu] = useState(false);
    // Merge only on first load
    theme ||= {
        ...DEFAULT_THEME,
        ...Object.fromEntries(
            Object.entries(themeConfig).map(([key, value]) => [
                key,
                value && typeof value === 'object' && DEEP_OBJECT_KEYS.includes(key)
                    ? { ...DEFAULT_THEME[key], ...value }
                    : value,
            ]),
        ),
    };
    if (process.env.NODE_ENV !== 'production' && !isValidated) {
        try {
            themeSchema.parse(theme);
        } catch (error) {
            console.error(
                `[nextra-theme-docs] Error validating theme config file.\n\n${normalizeZodMessage(
                    error,
                )}`,
            );
        }
        validateMeta(pageOpts.pageMap);
        isValidated = true;
    }
    const extendedConfig: Config = {
        newNextLinkBehavior: false,
        ...theme,
        flexsearch: pageOpts.flexsearch,
        ...(typeof pageOpts.newNextLinkBehavior === 'boolean' && {
            newNextLinkBehavior: pageOpts.newNextLinkBehavior,
        }),
        title: pageOpts.title,
        frontMatter: pageOpts.frontMatter,
    };

    return (
        <ConfigContext.Provider value={extendedConfig}>
            <MenuProvider value={{ menu, setMenu }}>{children}</MenuProvider>
        </ConfigContext.Provider>
    );
};
