import type { Localization, Message } from '@suite-common/suite-types';

import { getKillswitchMessage } from './featureFlags';

const content: Localization = { en: '', es: '', cs: '', de: '', fr: '', pt: '' };

const getFeatureMessage = (
    id: string,
    feature: Message['feature'],
    category: Message['category'] = 'feature',
): Message => ({
    id,
    priority: 100,
    dismissible: false,
    variant: 'critical',
    category,
    content,
    feature,
});

describe('getKillswitchMessage', () => {
    it('finds a message that raises the killswitch flag', () => {
        const killswitch = getFeatureMessage('killswitch', [{ domain: 'killswitch', flag: true }]);

        expect(getKillswitchMessage([getFeatureMessage('other', []), killswitch])).toBe(killswitch);
    });

    it('finds it also when the message is in several categories', () => {
        const killswitch = getFeatureMessage(
            'killswitch',
            [{ domain: 'killswitch', flag: true }],
            ['banner', 'feature'],
        );

        expect(getKillswitchMessage([killswitch])).toBe(killswitch);
    });

    it('ignores a lowered killswitch flag, an unrelated domain and another category', () => {
        expect(
            getKillswitchMessage([
                getFeatureMessage('lowered', [{ domain: 'killswitch', flag: false }]),
                getFeatureMessage('unrelated', [{ domain: 'coinjoin', flag: true }]),
                getFeatureMessage('banner', [{ domain: 'killswitch', flag: true }], 'banner'),
            ]),
        ).toBeUndefined();
    });
});
