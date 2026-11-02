import { asGetter } from '@trezor/dependency-injection';

import { type GetLanguage } from '../src/languages';

export const mockGetLanguage = (): GetLanguage => asGetter(() => 'en');
