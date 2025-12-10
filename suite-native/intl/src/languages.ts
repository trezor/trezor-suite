import { LocaleInfo } from '@suite-common/suite-types';

export const DEFAULT_LOCALE = 'en-US';
export type LocaleCode = `${string}-${string}`;

export const LANGUAGES = {
    'en-US': { icon: '🇬🇧', name: 'English', en: 'English', type: 'official' },
    'cs-CZ': { icon: '🇨🇿', name: 'Čeština', en: 'Czech', type: 'official' },
    'de-DE': { icon: '🇩🇪', name: 'Deutsch', en: 'German', type: 'official' },
    'pt-BR': { icon: '🇧🇷', name: 'Português (BR)', en: 'Portuguese (BR)', type: 'official' },
    'ja-JP': { icon: '🇯🇵', name: '日本語', en: 'Japanese', type: 'official' },
} as const satisfies Record<LocaleCode, LocaleInfo>;
