import { getEffectiveIntlMessages } from './getEffectiveIntlMessages';

describe(getEffectiveIntlMessages.name, () => {
    const localizedMessages = { TR_CANCEL: 'Cancel' };
    const definedMessageIds = ['TR_CANCEL', 'TR_ONLY_IN_SOURCE'];

    it('returns downloaded translations unchanged when overlay is off', () => {
        expect(
            getEffectiveIntlMessages({
                localizedMessages,
                definedMessageIds,
                showTranslationKeys: false,
            }),
        ).toBe(localizedMessages);
    });

    it('shows source message ids when overlay is on', () => {
        const result = getEffectiveIntlMessages({
            localizedMessages,
            definedMessageIds,
            showTranslationKeys: true,
        });

        expect(Object.keys(result)).toStrictEqual(definedMessageIds);
        expect(Object.values(result)).toStrictEqual(definedMessageIds);
    });
});
