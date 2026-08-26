import { createIntl, createIntlCache } from 'react-intl';

import { type Locator, expect as baseExpect } from '@playwright/test';

import { type TranslationKey, messages } from '@suite/intl';

/**
 * Translation-aware matchers, mirroring the ones in `suite/e2e/support/testExtends/customMatchers.ts`.
 * That file is not importable here because it also pulls in device and emulator fixtures.
 *
 * Copy is edited by translators in Crowdin independently of developers, so assert against the
 * translation key and let the matcher resolve it — never against literal text.
 */
const intlEn = createIntl({ locale: 'en', messages: {} }, createIntlCache());

type TranslationOptions = {
    values?: Record<string, string | number>;
    timeout?: number;
};

const translate = (key: TranslationKey, values?: TranslationOptions['values']) => {
    const message = messages[key];
    if (!message) {
        throw new Error(`Could not resolve translation key: ${key}`);
    }

    const template = message.defaultMessage;

    return values && Object.keys(values).length > 0
        ? String(intlEn.formatMessage({ id: key, defaultMessage: template }, values))
        : template;
};

export const expect = baseExpect.extend({
    async toHaveTranslation(
        locator: Locator,
        translationKey: TranslationKey,
        options?: TranslationOptions,
    ) {
        await baseExpect(locator).toHaveText(translate(translationKey, options?.values), {
            timeout: options?.timeout,
        });

        return { pass: true, message: () => 'errors are reported by the assertion above' };
    },

    async toContainTranslation(
        locator: Locator,
        translationKey: TranslationKey,
        options?: TranslationOptions,
    ) {
        await baseExpect(locator).toContainText(translate(translationKey, options?.values), {
            timeout: options?.timeout,
        });

        return { pass: true, message: () => 'errors are reported by the assertion above' };
    },
}) satisfies typeof baseExpect;
