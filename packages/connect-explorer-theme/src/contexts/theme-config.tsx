import type { ReactElement, ReactNode } from 'react';
import { createContext, useContext } from 'react';

import { ZodError } from 'zod';

import type { DocsThemeConfig } from '../schema';
import { themeSchema } from '../schema';

const ThemeConfigContext = createContext<DocsThemeConfig | null>(null);

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

// Dev-only safety net: `themeSchema` is a `strictObject`, so a typo'd or renamed key in
// `theme.config.tsx` is reported instead of silently doing nothing. Validated once per process.
function validateThemeConfig(themeConfig: DocsThemeConfig): void {
    if (isValidated) {
        return;
    }
    isValidated = true;
    try {
        themeSchema.parse(themeConfig);
    } catch (error) {
        console.error(
            `[nextra-theme-docs] Error validating theme config file.\n\n${normalizeZodMessage(
                error,
            )}`,
        );
    }
}

export const useThemeConfig = (): DocsThemeConfig => {
    const themeConfig = useContext(ThemeConfigContext);

    if (!themeConfig) {
        throw new Error('useThemeConfig must be used within ThemeConfigProvider');
    }

    return themeConfig;
};

type ThemeConfigProviderProps = {
    value: DocsThemeConfig;
    children: ReactNode;
};

export const ThemeConfigProvider = ({
    value,
    children,
}: ThemeConfigProviderProps): ReactElement => {
    if (process.env.NODE_ENV !== 'production') {
        validateThemeConfig(value);
    }

    return <ThemeConfigContext.Provider value={value}>{children}</ThemeConfigContext.Provider>;
};
