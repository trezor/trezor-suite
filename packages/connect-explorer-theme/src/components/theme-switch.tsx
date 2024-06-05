import type { ReactElement } from 'react';

import { useTheme } from 'next-themes';
import { useMounted } from 'nextra/hooks';
import { MoonIcon, SunIcon } from 'nextra/icons';
import { z } from 'zod';
import cn from 'clsx';

import { Select } from '@trezor/components';

import { useConfig } from '../contexts';

type ThemeSwitchProps = {
    lite?: boolean;
    className?: string;
};

export const themeOptionsSchema = z.strictObject({
    light: z.string(),
    dark: z.string(),
    system: z.string(),
});

type ThemeOptions = z.infer<typeof themeOptionsSchema>;

export function ThemeSwitch({ lite }: ThemeSwitchProps): ReactElement {
    const { setTheme, resolvedTheme, theme = '' } = useTheme();
    const mounted = useMounted();
    const config = useConfig().themeSwitch;

    const IconToUse = mounted && resolvedTheme === 'dark' ? MoonIcon : SunIcon;
    const options: ThemeOptions =
        typeof config.useOptions === 'function' ? config.useOptions() : config.useOptions;

    return (
        <Select
            size="small"
            isClean
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
            menuPosition="absolute"
            menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
            menuShouldScrollIntoView={false}
            menuPlacement="top"
            components={{
                DropdownIndicator: () => null,
                IndicatorSeparator: () => null,
            }}
            formatOptionLabel={(option, meta) => {
                if (meta.context === 'value') {
                    return (
                        <div
                            className={cn(
                                'nx-flex nx-w-full nx-px-2 nx-items-center nx-gap-2 nx-text-sm nx-font-medium nx-capitalize nx-transition-colors',
                                'nx-text-gray-600 dark:nx-text-gray-400 hover:nx-text-gray-900 dark:hover:nx-text-gray-50',
                            )}
                        >
                            <IconToUse />
                            <span className={lite ? 'md:nx-hidden' : ''}>{option.label}</span>
                        </div>
                    );
                }

                return option.label;
            }}
        />
    );
}
