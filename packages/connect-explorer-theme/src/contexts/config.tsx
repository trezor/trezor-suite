import type { ReactElement, ReactNode } from 'react';
import { useState } from 'react';

import type { PageMapItem, PageOpts } from 'nextra';
import { metaSchema } from 'nextra/normalize-pages';
import { ZodError } from 'zod';

import type { DocsThemeConfig } from '../schema';
import { themeSchema } from '../schema';
import { DEEP_OBJECT_KEYS, DEFAULT_THEME } from '../theme';
import { MenuProvider } from './menu';
import { type Config, ConfigContext } from './useConfig';

let theme: DocsThemeConfig;
let isValidated = false;

function normalizeZodMessage(error: unknown): string {
    if (!(error instanceof ZodError)) {
        return String(error);
    }

    return error.issues
        .flatMap(issue => {
            const themePath = issue.path.length > 0 && `Path: "${issue.path.join('.')}"`;
            const nestedErrors =
                issue.code === 'invalid_union'
                    ? issue.errors.flatMap(errs =>
                          errs.map(e =>
                              [e.message, e.path.length > 0 && `Path: "${e.path.join('.')}"`]
                                  .filter(Boolean)
                                  .join('. '),
                          ),
                      )
                    : [];

            return [[issue.message, themePath].filter(Boolean).join('. '), ...nestedErrors];
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
    value: { themeConfig: DocsThemeConfig; pageOpts: PageOpts };
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
