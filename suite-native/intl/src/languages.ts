import { LocaleInfo } from '@suite-common/suite-types';

export const DEFAULT_LOCALE = 'en-US';

export const LANGUAGES = {
    'en-US': { name: 'English', en: 'English', type: 'official' },
    'cs-CZ': { name: 'Čeština (beta)', en: 'Czech (beta)', type: 'community' },
} as const satisfies Record<string, LocaleInfo>;
