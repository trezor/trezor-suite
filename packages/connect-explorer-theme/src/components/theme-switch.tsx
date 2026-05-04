import type { ReactElement } from 'react';

import cn from 'clsx';
import { useTheme } from 'next-themes';
import { useMounted } from 'nextra/hooks';
import { MoonIcon, SunIcon } from 'nextra/icons';
import { type z } from 'zod';

import { Select } from '@trezor/components';

import { useThemeConfig } from '../contexts/theme-config';
import { type themeOptionsSchema } from '../schema';

type ThemeSwitchProps = {
    lite?: boolean;
    className?: string;
};

type ThemeOptions = z.infer<typeof themeOptionsSchema>;

export function ThemeSwitch({ lite }: ThemeSwitchProps): ReactElement {
    const { setTheme, resolvedTheme, theme = '' } = useTheme();
    const mounted = useMounted();
    const config = useThemeConfig().themeSwitch;

    const IconToUse = mounted && resolvedTheme === 'dark' ? MoonIcon : SunIcon;
    const options: ThemeOptions =
        typeof config.useOptions === 'function' ? config.useOptions() : config.useOptions;

    return (
        <Select
            size="small"
            options={[
                { value: 'light', label: options.light },
                { value: 'dark', label: options.dark },
                { value: 'system', label: options.system },
            ]}
            onChange={option => {
                setTheme(option.value);
            }}
            value={
                mounted
                    ? {
                          value: theme,
                          label: options[theme],
                      }
                    : undefined
            }
            menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
            menuShouldScrollIntoView={false}
            menuPlacement="top"
            formatOptionLabel={(option, meta) => {
                if (meta.context === 'value') {
                    return (
                        <div
                            className={cn(
                                '_flex _w-full _px-2 _items-center _gap-2 _text-sm _font-medium _capitalize _transition-colors',
                                '_text-gray-600 dark:_text-gray-400 hover:_text-gray-900 dark:hover:_text-gray-50',
                            )}
                        >
                            <IconToUse />
                            <span className={lite ? 'md:_hidden' : ''}>{option.label}</span>
                        </div>
                    );
                }

                return option.label;
            }}
        />
    );
}
