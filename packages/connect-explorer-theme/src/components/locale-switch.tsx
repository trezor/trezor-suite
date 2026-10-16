import type { ReactElement } from 'react';

import { addBasePath } from 'next/dist/client/add-base-path';
import { useRouter } from 'next/router';
import { GlobeIcon } from 'nextra/icons';

import { Select } from '@trezor/components';

import { useThemeConfig } from '../contexts/theme-config';

interface LocaleSwitchProps {
    lite?: boolean;
    className?: string;
}

export function LocaleSwitch({ lite, className }: LocaleSwitchProps): ReactElement | null {
    const themeConfig = useThemeConfig();
    const { locale, asPath } = useRouter();

    const options = themeConfig.i18n;
    if (!options.length) return null;

    const selected = options.find(l => locale === l.locale);

    return (
        <Select
            label="Change language"
            className={className}
            onChange={option => {
                const date = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
                document.cookie = `NEXT_LOCALE=${
                    option.value
                }; expires=${date.toUTCString()}; path=/`;
                location.href = addBasePath(asPath);
            }}
            value={{
                value: selected?.locale || '',
                label: (
                    <span className="_flex _items-center _gap-2">
                        <GlobeIcon />
                        <span className={lite ? '_hidden' : ''}>{selected?.name}</span>
                    </span>
                ),
            }}
            options={options.map(l => ({
                value: l.locale,
                label: l.name,
            }))}
        />
    );
}
