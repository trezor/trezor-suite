import { getMessagesForLocale } from './getMessagesForLocale';
import { DEFAULT_LOCALE } from './languages';
import { messages } from './messages';
import { flatten } from './utils';

const mockEvaluatedCatalogs: string[] = [];

jest.mock('../translations/cs-CZ.json', () => {
    mockEvaluatedCatalogs.push('cs-CZ');

    return { 'generic.buttons.cancel': 'Zrušit' };
});

jest.mock('../translations/de-DE.json', () => {
    mockEvaluatedCatalogs.push('de-DE');

    return {};
});

describe(getMessagesForLocale.name, () => {
    it('evaluates only the catalog of the requested locale', () => {
        getMessagesForLocale('cs-CZ');

        expect(mockEvaluatedCatalogs).toEqual(['cs-CZ']);
    });

    it('overrides the English default messages with the catalog of the locale', () => {
        expect(getMessagesForLocale('cs-CZ')['generic.buttons.cancel']).toBe('Zrušit');
    });

    it('falls back to English for a key missing in the catalog', () => {
        expect(getMessagesForLocale('cs-CZ')['generic.buttons.confirm']).toBe(
            messages.generic.buttons.confirm,
        );
    });

    it('returns the English default messages for the default locale', () => {
        expect(getMessagesForLocale(DEFAULT_LOCALE)).toEqual(flatten(messages));
    });

    it('returns the same object for repeated calls with the same locale', () => {
        expect(getMessagesForLocale('cs-CZ')).toBe(getMessagesForLocale('cs-CZ'));
    });
});
