import { LocaleInfo } from '@suite-common/suite-types';

export const DEFAULT_LOCALE = 'en-US';

export const LANGUAGES = {
    'en-US': { name: 'English', en: 'English', type: 'official' },
    'cs-CZ': { name: 'Čeština (beta)', en: 'Czech (beta)', type: 'community' },
    'de-DE': { name: 'Deutsch', en: 'German', type: 'official' },
    'pt-BR': { name: 'Português (BR)', en: 'Portuguese (BR)', type: 'official' },
    'ja-JP': { name: '日本語', en: 'Japanese', type: 'official' },
} as const satisfies Record<string, LocaleInfo>;
