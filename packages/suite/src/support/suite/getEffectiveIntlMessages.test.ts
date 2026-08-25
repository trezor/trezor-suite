import { getEffectiveIntlMessages } from './getEffectiveIntlMessages';

describe(getEffectiveIntlMessages.name, () => {
    it('returns downloaded translations unchanged when overlay is off', () => {
        const localizedMessages = { TR_CANCEL: 'Cancel' };

        expect(getEffectiveIntlMessages(localizedMessages, false)).toBe(localizedMessages);
    });

    it('shows downloaded translation ids when overlay is on', () => {
        const result = getEffectiveIntlMessages({ TR_CANCEL: 'Cancel' }, true);

        expect(result.TR_CANCEL).toBe('TR_CANCEL');
    });

    it('shows messages.ts ids that are missing from downloaded translations', () => {
        const result = getEffectiveIntlMessages({}, true);

        expect(result.TR_DEVICE_AUTHENTICITY_OPT_OUT_MODAL_TITLE).toBe(
            'TR_DEVICE_AUTHENTICITY_OPT_OUT_MODAL_TITLE',
        );
    });
});
