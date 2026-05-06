import { type TranslationKey } from '@suite/intl';
import { type IconName } from '@trezor/components';

export const CommandCategory = {
    Navigation: 'navigation',
    Settings: 'settings',
    Account: 'account',
    Action: 'action',
} as const;

export type CommandCategory = (typeof CommandCategory)[keyof typeof CommandCategory];

export type Command = {
    id: string;
    labelKey?: TranslationKey;
    label?: string;
    descriptionKey?: TranslationKey;
    description?: string;
    category: CommandCategory;
    icon: IconName;
    keywords: string[];
    execute: () => void;
    isAvailable?: boolean;
    shortcutHint?: string;
};
